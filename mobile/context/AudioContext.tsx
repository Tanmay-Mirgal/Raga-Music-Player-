import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { useUser } from '@clerk/clerk-expo';
import * as FileSystem from 'expo-file-system/legacy';
import { getDownloads } from '../utils/storage';

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
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  seekTo: (millis: number) => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  refreshDownloads: () => Promise<void>;
  logInteraction: (track: Track, type: string) => Promise<void>;
  toggleLikeTrack: (track: Track) => Promise<void>;
  fetchLikedSongs: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const globalActiveSounds: Audio.Sound[] = [];

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
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

  // Ref tracking for concurrent audio playing requests
  const activeSoundRef = useRef<Audio.Sound | null>(null);
  const playRequestCountRef = useRef(0);

  // Using refs for latest values inside the playback status update callback
  const currentIndexRef = useRef(currentIndex);
  const queueRef = useRef(queue);
  const isRepeatRef = useRef(isRepeat);
  const isShuffleRef = useRef(isShuffle);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    queueRef.current = queue;
    isRepeatRef.current = isRepeat;
    isShuffleRef.current = isShuffle;
  }, [currentIndex, queue, isRepeat, isShuffle]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      playThroughEarpieceAndroid: false,
    });
    refreshDownloads();

    return () => {
      for (const s of globalActiveSounds) {
        try {
          s.stopAsync();
          s.unloadAsync();
        } catch (e) {
          // ignore
        }
      }
      globalActiveSounds.length = 0;
    };
  }, []);

  const fetchLikedSongs = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/likes?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        // Remove duplicates by ID just in case
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

  const refreshDownloads = async () => {
    try {
      const stored = await getDownloads();
      setDownloadedTracks(stored);
    } catch (e) {
      console.error(e);
    }
  };

  const resolveUrl = async (track: Track) => {
    const downloaded = downloadedTracks.find((d) => d.id === track.id);
    if (downloaded && downloaded.localUri) {
      const fileExists = await FileSystem.getInfoAsync(downloaded.localUri);
      if (fileExists.exists) return downloaded.localUri;
    }
    const highQuality = track.downloadUrl?.find((t) => t.quality === '320kbps') || track.downloadUrl?.[0];
    return highQuality?.url || '';
  };

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

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        if (isRepeatRef.current) {
          activeSoundRef.current?.replayAsync();
        } else {
          skipToNextInternal();
        }
      }
    }
  };

  const skipToNextInternal = async () => {
    if (queueRef.current.length === 0) return;

    if (isShuffleRef.current) {
      const randomIndex = Math.floor(Math.random() * queueRef.current.length);
      await playTrackInternal(queueRef.current[randomIndex], queueRef.current, randomIndex);
    } else {
      const nextIdx = currentIndexRef.current + 1;
      if (nextIdx < queueRef.current.length) {
        await playTrackInternal(queueRef.current[nextIdx], queueRef.current, nextIdx);
      } else {
        // Loop back to the beginning of the queue to keep autoplay playing!
        await playTrackInternal(queueRef.current[0], queueRef.current, 0);
      }
    }
  };

  const playTrackInternal = async (track: Track, newQueue: Track[], index: number) => {
    const currentRequestId = ++playRequestCountRef.current;
    try {
      // 1. Globally stop and unload all sound objects in our registry first
      for (const s of globalActiveSounds) {
        try {
          await s.stopAsync();
        } catch (e) {}
        try {
          await s.unloadAsync();
        } catch (e) {}
      }
      globalActiveSounds.length = 0;

      // 2. Also stop and unload the current local ref
      if (activeSoundRef.current) {
        try {
          await activeSoundRef.current.stopAsync();
        } catch (e) {}
        try {
          await activeSoundRef.current.unloadAsync();
        } catch (e) {
          console.log('Error unloading activeSoundRef:', e);
        }
        activeSoundRef.current = null;
        setSound(null);
      }
      
      const url = await resolveUrl(track);
      if (!url) return;

      // Check if a newer request came in while resolving url
      if (currentRequestId !== playRequestCountRef.current) {
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      // Check if a newer request came in while loading sound
      if (currentRequestId !== playRequestCountRef.current) {
        try {
          await newSound.stopAsync();
        } catch (e) {}
        try {
          await newSound.unloadAsync();
        } catch (e) {}
        return;
      }

      // 3. Register this new sound globally
      globalActiveSounds.push(newSound);

      activeSoundRef.current = newSound;
      setSound(newSound);
      setCurrentTrack(track);
      setQueue(newQueue);
      setCurrentIndex(index);
      setIsPlaying(true);
      await newSound.playAsync();
      logInteraction(track, 'play');
    } catch (e) {
      console.error(e);
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
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const seekTo = async (millis: number) => {
    if (sound) {
      await sound.setPositionAsync(millis);
    }
  };

  const skipToNext = async () => skipToNextInternal();

  const skipToPrevious = async () => {
    if (queue.length === 0) return;
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      await playTrackInternal(queue[randomIndex], queue, randomIndex);
    } else {
      const prevIdx = currentIndex - 1;
      if (prevIdx >= 0) {
        await playTrackInternal(queue[prevIdx], queue, prevIdx);
      }
    }
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setIsRepeat(!isRepeat);

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
