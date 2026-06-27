import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-expo';
import * as FileSystem from 'expo-file-system/legacy';
import { getDownloads } from '../utils/storage';
import { loadTrackPlayer } from '../utils/trackPlayer';

export interface Track {
  id: string;
  name: string;
  artists: { primary: { name: string }[] };
  image: { url: string }[];
  downloadUrl: { url: string; quality: string }[];
  duration?: number;
  localUri?: string;
}

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: Track[];
  currentIndex: number;
  isShuffle: boolean;
  isRepeat: boolean;
  downloadedTracks: Track[];
  likedSongs: Track[];
  sleepTimerTimeLeft: number | null;
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  seekTo: (millis: number) => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => Promise<void>;
  refreshDownloads: () => Promise<void>;
  logInteraction: (track: Track, type: string) => Promise<void>;
  toggleLikeTrack: (track: Track) => Promise<void>;
  fetchLikedSongs: () => Promise<void>;
  setSleepTimer: (minutes: number | null) => void;
  removeFromQueue: (trackId: string) => void;
  moveQueueItem: (index: number, direction: 'up' | 'down') => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);
type TrackPlayerModule = Exclude<Awaited<ReturnType<typeof loadTrackPlayer>>, null>;

/** Convert our app Track to TrackPlayer's track format */
const toTPTrack = (track: Track, url: string) => ({
  id: track.id,
  url,
  title: track.name,
  artist: track.artists?.primary?.[0]?.name || 'Unknown Artist',
  artwork: track.image?.[2]?.url || track.image?.[1]?.url || track.image?.[0]?.url || '',
  duration: track.duration ? track.duration / 1000 : undefined,
});

let playerSetup = false;

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const trackPlayerRef = useRef<TrackPlayerModule | null>(null);

  const [queue, setQueue] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [downloadedTracks, setDownloadedTracks] = useState<Track[]>([]);
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);

  const [sleepTimerTimeLeft, setSleepTimerTimeLeft] = useState<number | null>(null);
  const sleepTimerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs for latest values inside event callbacks
  const queueRef = useRef(queue);
  const isShuffleRef = useRef(isShuffle);
  const isRepeatRef = useRef(isRepeat);

  useEffect(() => {
    queueRef.current = queue;
    isShuffleRef.current = isShuffle;
    isRepeatRef.current = isRepeat;
  }, [queue, isShuffle, isRepeat]);

  const syncProgress = async (tp: TrackPlayerModule) => {
    try {
      const [currentPosition, currentDuration] = await Promise.all([
        tp.getPosition(),
        tp.getDuration(),
      ]);

      setPosition(Math.max(0, Math.floor(currentPosition * 1000)));
      setDuration(Math.max(0, Math.floor(currentDuration * 1000)));
    } catch (error) {
      console.warn('[TrackPlayer] Failed to read progress:', error);
    }
  };

  const refreshDownloads = async () => {
    try {
      const stored = await getDownloads();
      setDownloadedTracks(stored);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLikedSongs = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/likes?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const uniqueData = data.filter(
          (track: Track, index: number, self: Track[]) =>
            self.findIndex((t) => t.id === track.id) === index
        );
        setLikedSongs(uniqueData);
      }
    } catch (e) {
      console.error('Error fetching liked songs:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLikedSongs();
    } else {
      setLikedSongs([]);
    }
  }, [user]);

  const logInteraction = async (track: Track, type: string) => {
    if (!user) return;
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          track,
          interactionType: type,
        }),
      });
    } catch (e) {
      console.log('Failed to log interaction', e);
    }
  };

  const toggleLikeTrack = async (track: Track) => {
    if (!user) return;
    const isCurrentlyLiked = likedSongs.some((t) => t.id === track.id);
    try {
      if (isCurrentlyLiked) {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/likes?userId=${user.id}&songId=${track.id}`,
          { method: 'DELETE' }
        );
        if (res.ok) {
          setLikedSongs((prev) => prev.filter((t) => t.id !== track.id));
          logInteraction(track, 'unlike');
        }
      } else {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/likes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, track }),
        });
        if (res.ok) {
          setLikedSongs((prev) => {
            if (prev.some((t) => t.id === track.id)) return prev;
            return [track, ...prev];
          });
          logInteraction(track, 'like');
        }
      }
    } catch (e) {
      console.error('Error toggling like status:', e);
    }
  };

  const resolveUrl = async (track: Track): Promise<string> => {
    const downloaded = downloadedTracks.find((d) => d.id === track.id);
    if (downloaded && downloaded.localUri) {
      const fileExists = await FileSystem.getInfoAsync(downloaded.localUri);
      if (fileExists.exists) return downloaded.localUri;
    }
    const highQuality = track.downloadUrl?.find((t) => t.quality === '320kbps') || track.downloadUrl?.[0];
    return highQuality?.url || '';
  };

  useEffect(() => {
    let cancelled = false;
    let progressTimer: ReturnType<typeof setInterval> | null = null;
    const listeners: Array<{ remove?: () => void }> = [];

    const setup = async () => {
      const tp = await loadTrackPlayer();
      if (cancelled || !tp) {
        return;
      }

      trackPlayerRef.current = tp;

      if (!playerSetup) {
        try {
          await tp.setupPlayer({
            maxCacheSize: 1024 * 5,
          });
          await tp.updateOptions({
            android: {
              appKilledPlaybackBehavior: tp.AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
            },
            capabilities: [
              tp.Capability.Play,
              tp.Capability.Pause,
              tp.Capability.SkipToNext,
              tp.Capability.SkipToPrevious,
              tp.Capability.SeekTo,
              tp.Capability.Stop,
            ],
            compactCapabilities: [
              tp.Capability.Play,
              tp.Capability.Pause,
              tp.Capability.SkipToNext,
            ],
            notificationCapabilities: [
              tp.Capability.Play,
              tp.Capability.Pause,
              tp.Capability.SkipToNext,
              tp.Capability.SkipToPrevious,
              tp.Capability.SeekTo,
            ],
          });
          playerSetup = true;
          console.log('[TrackPlayer] Setup complete');
        } catch (e) {
          console.error('[TrackPlayer] Setup error:', e);
          return;
        }
      }

      await syncProgress(tp);
      if (!cancelled) {
        progressTimer = setInterval(() => {
          void syncProgress(tp);
        }, 500);
      }

      listeners.push(
        tp.addEventListener(tp.Event.PlaybackState, (event) => {
          if (cancelled) return;
          setIsPlaying(event.state === tp.State.Playing);
        }),
        tp.addEventListener(tp.Event.PlaybackActiveTrackChanged, async () => {
          if (cancelled) return;
          const activeIndex = await tp.getActiveTrackIndex();
          if (activeIndex !== undefined && activeIndex !== null && activeIndex >= 0) {
            setCurrentIndex(activeIndex);
            const appTrack = queueRef.current[activeIndex];
            if (appTrack) {
              setCurrentTrack(appTrack);
            }
          }
        }),
        tp.addEventListener(tp.Event.PlaybackQueueEnded, async () => {
          if (cancelled) return;
          const q = queueRef.current;
          if (q.length > 0) {
            if (isShuffleRef.current) {
              const randomIndex = Math.floor(Math.random() * q.length);
              await playTrackInternal(q[randomIndex], q, randomIndex);
            } else {
              await playTrackInternal(q[0], q, 0);
            }
          }
        })
      );
    };

    void setup();
    void refreshDownloads();

    return () => {
      cancelled = true;
      if (progressTimer) {
        clearInterval(progressTimer);
      }
      listeners.forEach((listener) => listener?.remove?.());
      if (sleepTimerIntervalRef.current) {
        clearInterval(sleepTimerIntervalRef.current);
      }
    };
  }, []);

  const playTrackInternal = async (track: Track, newQueue: Track[], index: number) => {
    try {
      const url = await resolveUrl(track);
      if (!url) {
        console.error('[TrackPlayer] No URL for track:', track.name);
        return;
      }

      const tp = trackPlayerRef.current || (await loadTrackPlayer());
      if (!tp) {
        setCurrentTrack(track);
        setQueue(newQueue);
        setCurrentIndex(index);
        setIsPlaying(false);
        return;
      }

      const tpTracks = await Promise.all(
        newQueue.map(async (t) => {
          const tUrl = await resolveUrl(t);
          return toTPTrack(t, tUrl);
        })
      );

      await tp.reset();
      await tp.add(tpTracks);
      await tp.skip(index);
      await tp.play();

      setCurrentTrack(track);
      setQueue(newQueue);
      setCurrentIndex(index);
      setIsPlaying(true);

      logInteraction(track, 'play');
    } catch (e) {
      console.error('[TrackPlayer] playTrackInternal error:', e);
    }
  };

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    let q = newQueue || queue;
    if (!newQueue && q.length === 0) {
      q = [track];
    }
    const idx = q.findIndex((t) => t.id === track.id);
    await playTrackInternal(track, q, idx >= 0 ? idx : 0);
  };

  const togglePlay = async () => {
    const tp = trackPlayerRef.current || (await loadTrackPlayer());
    if (!tp) return;
    const state = await tp.getPlaybackState();
    if (state.state === tp.State.Playing) {
      await tp.pause();
    } else {
      await tp.play();
    }
  };

  // seekTo accepts milliseconds (matching old expo-av API), converts to seconds for TrackPlayer
  const seekTo = async (millis: number) => {
    const tp = trackPlayerRef.current || (await loadTrackPlayer());
    if (!tp) return;
    await tp.seekTo(millis / 1000);
  };

  const skipToNext = async () => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      await playTrackInternal(queue[randomIndex], queue, randomIndex);
      return;
    }

    const tp = trackPlayerRef.current || (await loadTrackPlayer());
    if (!tp) return;

    try {
      await tp.skipToNext();
    } catch {
      if (queue.length > 0) {
        await playTrackInternal(queue[0], queue, 0);
      }
    }
  };

  const skipToPrevious = async () => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      await playTrackInternal(queue[randomIndex], queue, randomIndex);
      return;
    }

    const tp = trackPlayerRef.current || (await loadTrackPlayer());
    if (!tp) return;

    try {
      await tp.skipToPrevious();
    } catch {
      // Already at beginning
    }
  };

  const toggleShuffle = () => setIsShuffle((v) => !v);

  const toggleRepeat = async () => {
    const next = !isRepeat;
    setIsRepeat(next);

    const tp = trackPlayerRef.current || (await loadTrackPlayer());
    if (!tp) return;
    await tp.setRepeatMode(next ? tp.RepeatMode.Track : tp.RepeatMode.Off);
  };

  // Sleep Timer
  const setSleepTimer = (minutes: number | null) => {
    if (sleepTimerIntervalRef.current) {
      clearInterval(sleepTimerIntervalRef.current);
      sleepTimerIntervalRef.current = null;
    }

    if (minutes === null) {
      setSleepTimerTimeLeft(null);
      return;
    }

    let secondsLeft = minutes * 60;
    setSleepTimerTimeLeft(secondsLeft);

    sleepTimerIntervalRef.current = setInterval(async () => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        if (sleepTimerIntervalRef.current) {
          clearInterval(sleepTimerIntervalRef.current);
          sleepTimerIntervalRef.current = null;
        }
        setSleepTimerTimeLeft(null);
        setIsPlaying(false);
        try {
          const tp = trackPlayerRef.current || (await loadTrackPlayer());
          await tp?.pause();
        } catch (e) {
          console.error('Error pausing on sleep timer:', e);
        }
      } else {
        setSleepTimerTimeLeft(secondsLeft);
      }
    }, 1000);
  };

  // Queue management
  const removeFromQueue = async (trackId: string) => {
    const itemIndex = queue.findIndex((t) => t.id === trackId);
    if (itemIndex === -1) return;

    const newQueue = queue.filter((t) => t.id !== trackId);
    const tp = trackPlayerRef.current || (await loadTrackPlayer());

    if (newQueue.length === 0) {
      await tp?.reset();
      setCurrentTrack(null);
      setQueue([]);
      setCurrentIndex(-1);
      setIsPlaying(false);
      return;
    }

    if (currentTrack?.id === trackId) {
      const nextIdx = itemIndex < newQueue.length ? itemIndex : 0;
      await playTrackInternal(newQueue[nextIdx], newQueue, nextIdx);
      return;
    }

    setQueue(newQueue);
    const newCurrentIdx = currentIndex > itemIndex ? currentIndex - 1 : currentIndex;
    setCurrentIndex(newCurrentIdx);
    setCurrentTrack(newQueue[newCurrentIdx] ?? null);

    if (!tp) {
      return;
    }

    const tpTracks = await Promise.all(
      newQueue.map(async (t) => {
        const url = await resolveUrl(t);
        return toTPTrack(t, url);
      })
    );

    await tp.reset();
    await tp.add(tpTracks);
    await tp.skip(newCurrentIdx);
    await tp.play();
  };

  const moveQueueItem = async (index: number, direction: 'up' | 'down') => {
    if (index < 0 || index >= queue.length) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= queue.length) return;

    const newQueue = [...queue];
    const temp = newQueue[index];
    newQueue[index] = newQueue[targetIndex];
    newQueue[targetIndex] = temp;

    setQueue(newQueue);

    let newCurrentIdx = currentIndex;
    if (currentIndex === index) {
      newCurrentIdx = targetIndex;
    } else if (currentIndex === targetIndex) {
      newCurrentIdx = index;
    }

    setCurrentIndex(newCurrentIdx);
    setCurrentTrack(newQueue[newCurrentIdx] ?? null);

    const tp = trackPlayerRef.current || (await loadTrackPlayer());
    if (!tp) {
      return;
    }

    const tpTracks = await Promise.all(
      newQueue.map(async (t) => {
        const url = await resolveUrl(t);
        return toTPTrack(t, url);
      })
    );

    await tp.reset();
    await tp.add(tpTracks);
    await tp.skip(newCurrentIdx);
    await tp.play();
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        position,
        duration,
        queue,
        currentIndex,
        isShuffle,
        isRepeat,
        downloadedTracks,
        likedSongs,
        sleepTimerTimeLeft,
        playTrack,
        togglePlay,
        seekTo,
        skipToNext,
        skipToPrevious,
        toggleShuffle,
        toggleRepeat,
        refreshDownloads,
        logInteraction,
        toggleLikeTrack,
        fetchLikedSongs,
        setSleepTimer,
        removeFromQueue,
        moveQueueItem,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
