import { useEffect } from 'react';
import { useVideo } from '../video/VideoProvider';
import { biliRequest } from '../account/api';
import { useHistory } from './HistoryProvider';

export function HistoryPlaybackObserver() {
  const player = useVideo(), history = useHistory();
  const media = player.getMediaElement(), uid = history.uid, video = player.video;
  const record = history.record, reportError = history.reportError;
  useEffect(() => {
    if (!uid || !video) return;
    let actuallyPlayed = false, lastReport = 0, inFlight = 0, stopped = false, reportRevision = 0;
    let previousTime = media.currentTime;
    const send = async (force = false) => {
      if (!actuallyPlayed || stopped) return;
      if (inFlight && !force) return;
      const payload = { uid,bvid:video.bvid,cid:video.cid,time:media.currentTime,ended:media.ended };
      const revision = ++reportRevision;
      inFlight++; lastReport = Date.now();
      try {
        await biliRequest('historyHeartbeat',payload);
        if (!stopped && revision === reportRevision) reportError(uid,'');
      } catch (e) { if (!stopped && revision === reportRevision && (e as {code?:string}).code !== 'CANCELLED') reportError(uid,'观看进度同步失败：' + (e as Error).message); }
      finally { inFlight--; }
    };
    const tick = () => {
      const time = media.currentTime;
      if (!media.paused && !media.seeking && time > previousTime && time - previousTime < 5 && media.readyState >= 2) {
        if (!actuallyPlayed) { actuallyPlayed = true; record(uid,video); }
        if (Date.now() - lastReport >= 15000 && !inFlight) void send();
      }
      previousTime = time;
    };
    const flush = () => { if (actuallyPlayed) void send(true); };
    // reset() notifies before load() can discard queued pause events or zero the position.
    const beforeReset = () => { flush(); stopped = true; };
    media.addEventListener('timeupdate',tick); media.addEventListener('pause',flush); media.addEventListener('ended',flush);
    media.addEventListener('bilibili-before-reset',beforeReset);
    return () => { stopped = true; media.removeEventListener('timeupdate',tick); media.removeEventListener('pause',flush); media.removeEventListener('ended',flush); media.removeEventListener('bilibili-before-reset',beforeReset); };
  }, [uid,video?.bvid,video?.cid,media,record,reportError]);
  return null;
}
