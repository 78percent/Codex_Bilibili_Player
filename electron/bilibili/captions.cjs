const { BiliError } = require('./client.cjs');

function createCaptions(client, publicSession) {
  let generation = 0;
  const tracks = new Map(), requests = new Set();
  async function download(url, format) {
    const controller = new AbortController();
    requests.add(controller);
    try {
      const response = await publicSession.fetch(url, {
        credentials: 'omit', redirect: 'error',
        headers: { Referer: 'https://www.bilibili.com/' },
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      });
      if (!response.ok) { await response.body?.cancel(); throw new BiliError('暂时无法读取字幕或弹幕'); }
      return format === 'json' ? await response.json() : await response.text();
    } catch (error) {
      if (error instanceof BiliError) throw error;
      throw new BiliError('暂时无法读取字幕或弹幕');
    } finally { requests.delete(controller); }
  }
  return {
    reset() { generation++; tracks.clear(); for (const request of requests) request.abort(); },
    async subtitles(video) {
      const current = generation;
      const data = await client.signed('/x/player/wbi/v2', { bvid: video.bvid, cid: video.cid });
      if (current !== generation) throw new BiliError('选片已取消', 'CANCELLED');
      tracks.clear();
      return (data.subtitle?.subtitles || []).flatMap(track => {
        const url = new URL(String(track.subtitle_url || '').replace(/^http:/, 'https:'), 'https://www.bilibili.com');
        if (url.protocol !== 'https:' || !url.hostname.endsWith('.hdslb.com') || url.port || url.username || url.password || !url.pathname.startsWith('/bfs/subtitle/')) return [];
        const id = String(track.id_str || track.id);
        tracks.set(id, url.href);
        return [{ id, language: String(track.lan || ''), label: String(track.lan_doc || track.lan || '字幕') }];
      });
    },
    async subtitle(id) {
      if (typeof id !== 'string' || !tracks.has(id)) throw new BiliError('字幕轨道不可用', 'INPUT');
      const data = await download(tracks.get(id), 'json');
      if (!Array.isArray(data.body)) throw new BiliError('字幕格式不可用');
      return data.body.filter(cue => Number.isFinite(cue.from) && Number.isFinite(cue.to) && cue.to > cue.from && typeof cue.content === 'string')
        .map(({ from, to, content }) => ({ from, to, content })).sort((a, b) => a.from - b.from);
    },
    async danmaku(video) {
      const xml = await download(`https://api.bilibili.com/x/v1/dm/list.so?oid=${video.cid}`, 'text');
      if (!xml.trimStart().startsWith('<') || !/<i[\s>]/.test(xml)) throw new BiliError('弹幕格式不可用');
      return xml;
    },
  };
}
module.exports = { createCaptions };
