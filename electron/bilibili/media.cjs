const http = require('node:http');
const { randomBytes } = require('node:crypto');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { BiliError } = require('./client.cjs');
const xml = value => String(value).replace(/[<>&"']/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;' }[c]));
const { mediaURL, selectMediaURL } = require('./media-url.cjs');
function createMedia(session) {
  let token = '';
  let base = '', manifest = '', resources = new Map();
  const controllers = new Set();
  function reset() { token = ''; manifest = ''; resources.clear(); for (const c of controllers) c.abort(); controllers.clear(); }
  const server = http.createServer(async (req, res) => {
    let url;
    try { url = new URL(req.url, base); }
    catch { res.writeHead(400).end(); return; }
    if (!token || req.headers.host !== new URL(base).host || url.origin !== base || !url.pathname.startsWith(`/${token}/`)) { res.writeHead(403).end(); return; }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    res.setHeader('Cache-Control','no-store');
    if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    const id = url.pathname.split('/')[2];
    if (id === 'manifest.mpd' && manifest) { res.setHeader('Content-Type','application/dash+xml'); res.end(req.method === 'HEAD' ? undefined : manifest); return; }
    if (!resources.has(id)) { res.writeHead(404).end(); return; }
    const range = req.headers.range;
    if (range && !/^bytes=\d+-\d*$/.test(range)) { res.writeHead(416).end(); return; }
    const controller = new AbortController(); controllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 120000);
    res.on('close', () => controller.abort());
    try {
      let upstream = resources.get(id), response;
      for (let redirects = 0; redirects < 4; redirects++) {
        response = await session.fetch(mediaURL(upstream), { method: req.method, credentials: 'omit', redirect: 'manual', signal: controller.signal,
          headers: { Referer: 'https://www.bilibili.com/', ...(range ? { Range: range } : {}) } });
        if (![301,302,303,307,308].includes(response.status)) break;
        const location = response.headers.get('location'); await response.body?.cancel();
        if (!location) throw new Error('missing redirect');
        upstream = mediaURL(new URL(location,upstream).href);
      }
      if (![200,206].includes(response.status)) { await response.body?.cancel(); res.writeHead(response.status === 416 ? 416 : 502).end(); return; }
      for (const name of ['content-type','content-length','content-range','accept-ranges']) {
        const value = response.headers.get(name); if (value) res.setHeader(name,value);
      }
      res.writeHead(response.status);
      if (req.method === 'HEAD') { res.end(); return; }
      await pipeline(Readable.fromWeb(response.body),res);
    } catch { if (!res.headersSent) res.writeHead(502).end(); else res.destroy(); }
    finally { clearTimeout(timeout); controllers.delete(controller); }
  });
  async function start() {
    await new Promise((resolve,reject) => { server.once('error',reject); server.listen(0,'127.0.0.1',resolve); });
    base = `http://127.0.0.1:${server.address().port}`;
  }
  function prepare(data) {
    // Old manifests and delayed range requests must never resolve to a new video.
    const nextToken = randomBytes(24).toString('hex');
    const dash = data.dash;
    if (!dash?.video?.length || !dash.audio?.length) throw new BiliError('此视频没有可用的 DASH 音视频流');
    const video = dash.video.filter(v => v.codecid === 7 && String(v.codecs).startsWith('avc1') && ![125,126].includes(v.id));
    const audio = dash.audio.filter(a => String(a.codecs).startsWith('mp4a')).sort((a,b) => b.bandwidth-a.bandwidth)[0];
    if (!video.length || !audio) throw new BiliError('当前视频没有客户端支持的 H.264 / AAC 码流');
    const nextResources = new Map();
    const unique = [...new Map(video.map(v => [v.id,v])).values()].sort((a,b) => a.id-b.id);
    const representation = (stream, kind, index) => {
      const id = `${kind}-${index}`, segment = stream.SegmentBase || stream.segment_base;
      const indexRange = segment?.indexRange ?? segment?.index_range;
      const initRange = segment?.Initialization ?? segment?.initialization;
      if (!/^\d+-\d+$/.test(indexRange) || !/^\d+-\d+$/.test(initRange)) throw new BiliError('视频分段信息不完整，暂时无法播放');
      nextResources.set(id, selectMediaURL(stream));
      return `<Representation id="${id}" bandwidth="${Number(stream.bandwidth)}" codecs="${xml(stream.codecs)}" ${kind === 'v' ? `width="${Number(stream.width)}" height="${Number(stream.height)}"` : ''}><BaseURL>${xml(`${base}/${nextToken}/${id}`)}</BaseURL><SegmentBase indexRange="${indexRange}"><Initialization range="${initRange}"/></SegmentBase></Representation>`;
    };
    const duration = Number(dash.duration);
    if (!(duration > 0)) throw new BiliError('视频时长信息不完整');
    const videoXML = unique.map((v,i) => representation(v,'v',i)).join('');
    const audioXML = representation(audio,'a',0);
    const nextManifest = `<?xml version="1.0" encoding="UTF-8"?><MPD xmlns="urn:mpeg:dash:schema:mpd:2011" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011" type="static" mediaPresentationDuration="PT${duration}S" minBufferTime="PT1.5S"><Period duration="PT${duration}S"><AdaptationSet contentType="video" mimeType="video/mp4" segmentAlignment="true">${videoXML}</AdaptationSet><AdaptationSet contentType="audio" mimeType="audio/mp4" lang="zh">${audioXML}</AdaptationSet></Period></MPD>`;
    reset(); token = nextToken; resources = nextResources; manifest = nextManifest;
    const qualities = unique.map((v,i) => ({ id: `v-${i}`, quality: v.id, label: data.support_formats?.find(f => f.quality === v.id)?.new_description || `${v.height}P`, codec: v.codecs, width: v.width, height: v.height }));
    const initial = qualities.filter(q => q.height <= 1080).at(-1) || qualities[0];
    return { manifest: `${base}/${token}/manifest.mpd`, qualities, initialQuality: initial.id, duration };
  }
  return { start, prepare, reset, close: () => { reset(); server.close(); } };
}
module.exports = { createMedia };
