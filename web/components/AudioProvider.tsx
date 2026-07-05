'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { getLikedSongs, likeSong, unlikeSong, logInteraction as apiLogInteraction } from '@/lib/api';

export interface Track {
  id: string;
  name: string;
  artists: { primary: { name: string }[] };
  image: { url: string }[];
  downloadUrl: { url: string; quality: string }[];
  duration?: number;
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
  likedSongs: Track[];
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  volume: number;
  setVolume: (val: number) => void;
  toggleLikeTrack: (track: Track) => Promise<void>;
  fetchLikedSongs: () => Promise<void>;
  logInteraction: (track: Track, type: string) => Promise<void>;
}

const AudioCtx = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [volume, setVolumeState] = useState(0.8);

  // Refs for callbacks
  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  const isRepeatRef = useRef(isRepeat);
  const isShuffleRef = useRef(isShuffle);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { isRepeatRef.current = isRepeat; }, [isRepeat]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);

  // Init audio element
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.8;
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => setPosition(audio.currentTime));
    audio.addEventListener('durationchange', () => setDuration(audio.duration || 0));
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  function handleEnded() {
    if (isRepeatRef.current) {
      audioRef.current!.currentTime = 0;
      audioRef.current!.play();
    } else {
      skipToNextInternal();
    }
  }

  function getStreamUrl(track: Track): string {
    const hq = track.downloadUrl?.find((t) => t.quality === '320kbps') || track.downloadUrl?.[0];
    return hq?.url || '';
  }

  const playTrackInternal = useCallback((track: Track, newQueue: Track[], index: number) => {
    const url = getStreamUrl(track);
    if (!url) return;

    const audio = audioRef.current!;
    audio.src = url;
    audio.load();
    audio.play().catch(console.error);

    setCurrentTrack(track);
    setQueue(newQueue);
    setCurrentIndex(index);
    setIsPlaying(true);
    setPosition(0);

    if (user) {
      apiLogInteraction(user.id, track, 'play').catch(console.error);
    }
  }, [user]);

  function skipToNextInternal() {
    const q = queueRef.current;
    if (!q.length) return;
    let nextIdx: number;
    if (isShuffleRef.current) {
      nextIdx = Math.floor(Math.random() * q.length);
    } else {
      nextIdx = currentIndexRef.current + 1;
      if (nextIdx >= q.length) nextIdx = 0;
    }
    playTrackInternal(q[nextIdx], q, nextIdx);
  }

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    const q = newQueue || queue;
    const finalQueue = q.length ? q : [track];
    const idx = finalQueue.findIndex((t) => t.id === track.id);
    playTrackInternal(track, finalQueue, idx >= 0 ? idx : 0);
  }, [queue, playTrackInternal]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  }, [isPlaying]);

  const seekTo = useCallback((seconds: number) => {
    if (audioRef.current) audioRef.current.currentTime = seconds;
  }, []);

  const skipToNext = useCallback(() => skipToNextInternal(), []);

  const skipToPrevious = useCallback(() => {
    const q = queueRef.current;
    if (!q.length) return;
    if (isShuffleRef.current) {
      const ri = Math.floor(Math.random() * q.length);
      playTrackInternal(q[ri], q, ri);
    } else {
      const prevIdx = currentIndexRef.current - 1;
      if (prevIdx >= 0) playTrackInternal(q[prevIdx], q, prevIdx);
    }
  }, [playTrackInternal]);

  const toggleShuffle = useCallback(() => setIsShuffle((s) => !s), []);
  const toggleRepeat = useCallback(() => setIsRepeat((r) => !r), []);

  const fetchLikedSongs = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getLikedSongs(user.id);
      const unique = data.filter(
        (t: Track, i: number, arr: Track[]) => arr.findIndex((x) => x.id === t.id) === i
      );
      setLikedSongs(unique);
    } catch (e) {
      console.error('Error fetching liked songs:', e);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchLikedSongs();
    else setLikedSongs([]);
  }, [user, fetchLikedSongs]);

  const toggleLikeTrack = useCallback(async (track: Track) => {
    if (!user) return;
    const isLiked = likedSongs.some((t) => t.id === track.id);
    if (isLiked) {
      const res = await unlikeSong(user.id, track.id);
      if (res.ok) {
        setLikedSongs((prev) => prev.filter((t) => t.id !== track.id));
        apiLogInteraction(user.id, track, 'unlike').catch(console.error);
      }
    } else {
      const res = await likeSong(user.id, track);
      if (res.ok) {
        setLikedSongs((prev) => {
          if (prev.some((t) => t.id === track.id)) return prev;
          return [track, ...prev];
        });
        apiLogInteraction(user.id, track, 'like').catch(console.error);
      }
    }
  }, [user, likedSongs]);

  const logInteraction = useCallback(async (track: Track, type: string) => {
    if (!user) return;
    await apiLogInteraction(user.id, track, type).catch(console.error);
  }, [user]);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  }, []);

  return (
    <AudioCtx.Provider value={{
      currentTrack, isPlaying, position, duration,
      queue, currentIndex, isShuffle, isRepeat, likedSongs,
      volume, setVolume,
      playTrack, togglePlay, seekTo, skipToNext, skipToPrevious,
      toggleShuffle, toggleRepeat, toggleLikeTrack,
      fetchLikedSongs, logInteraction,
    }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
