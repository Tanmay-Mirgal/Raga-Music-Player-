import { loadTrackPlayer } from '../utils/trackPlayer';

/**
 * PlaybackService runs in background even when app is closed/backgrounded.
 * It handles remote control events from lock screen, notifications, and headsets.
 */
export async function PlaybackService() {
  const TrackPlayer = await loadTrackPlayer();
  if (!TrackPlayer) {
    return;
  }

  TrackPlayer.addEventListener(TrackPlayer.Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(TrackPlayer.Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(TrackPlayer.Event.RemoteStop, () => {
    TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(TrackPlayer.Event.RemoteNext, () => {
    TrackPlayer.skipToNext();
  });

  TrackPlayer.addEventListener(TrackPlayer.Event.RemotePrevious, () => {
    TrackPlayer.skipToPrevious();
  });

  TrackPlayer.addEventListener(TrackPlayer.Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });

  TrackPlayer.addEventListener(TrackPlayer.Event.RemoteDuck, async (event) => {
    if (event.permanent) {
      TrackPlayer.stop();
    } else if (event.paused) {
      TrackPlayer.pause();
    } else {
      TrackPlayer.play();
    }
  });
}
