'use client';

import React, { useState } from 'react';
import { useAudio } from './AudioProvider';
import {
  Play, Pause, SkipForward, SkipBack, Heart, ChevronUp,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX, Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import FullPlayerModal from './FullPlayerModal';

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MiniPlayer() {
  const {
    currentTrack, isPlaying, position, duration,
    togglePlay, seekTo, skipToNext, skipToPrevious,
    isShuffle, isRepeat, toggleShuffle, toggleRepeat,
    likedSongs, toggleLikeTrack, volume, setVolume
  } = useAudio();

  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);

  if (!currentTrack) return null;

  const isLiked = likedSongs.some((t) => t.id === currentTrack.id);
  const imageUrl = currentTrack.image?.[1]?.url || currentTrack.image?.[0]?.url || '';
  const artistName = currentTrack.artists?.primary?.[0]?.name || 'Unknown Artist';
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const handleToggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 0.8);
    }
  };

  return (
    <>
      {/* Mini Player Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:left-[240px] bg-[#181818] border-t border-white/5 px-4 py-3 md:py-4 cursor-pointer select-none"
        style={{ backgroundImage: 'linear-gradient(to top, #121212, #181818)' }}
      >
        {/* --- MOBILE / TABLET LAYOUT (below md) --- */}
        <div className="md:hidden flex flex-col">
          {/* Top Progress Line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
            <div
              className="h-full bg-[#1DB954] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Click info to expand */}
            <div
              className="flex items-center gap-3 flex-1 min-w-0"
              onClick={() => setShowFullPlayer(true)}
            >
              <div className="w-10 h-10 rounded bg-[#282828] overflow-hidden flex-shrink-0">
                {imageUrl && <img src={imageUrl} alt={currentTrack.name} className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{currentTrack.name}</p>
                <p className="text-[10px] text-[#B3B3B3] truncate">{artistName}</p>
              </div>
              <ChevronUp size={16} className="text-[#B3B3B3] flex-shrink-0" />
            </div>

            {/* Compact controls */}
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => toggleLikeTrack(currentTrack)} className="p-1.5 text-[#B3B3B3] hover:text-white transition-colors">
                <Heart size={16} className={cn(isLiked && 'text-[#1DB954] fill-[#1DB954]')} />
              </button>
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause size={14} className="text-black" fill="currentColor" /> : <Play size={14} className="text-black ml-0.5" fill="currentColor" />}
              </button>
              <button onClick={skipToNext} className="p-1.5 text-[#B3B3B3] hover:text-white transition-colors">
                <SkipForward size={16} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>

        {/* --- DESKTOP PREMIUM LAYOUT (md and up) --- */}
        <div className="hidden md:grid grid-cols-3 items-center justify-between max-w-screen-xl mx-auto w-full">
          {/* Left Column: Track Info + Like */}
          <div className="flex items-center gap-4 min-w-0" onClick={() => setShowFullPlayer(true)}>
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#282828] flex-shrink-0 shadow-md">
              {imageUrl && <img src={imageUrl} alt={currentTrack.name} className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate hover:underline">{currentTrack.name}</p>
              <p className="text-xs text-[#B3B3B3] truncate mt-0.5 hover:underline hover:text-white">{artistName}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleLikeTrack(currentTrack); }}
              className="p-2 text-[#B3B3B3] hover:text-white transition-colors flex-shrink-0"
            >
              <Heart size={18} className={cn('transition-all', isLiked ? 'text-[#1DB954] fill-[#1DB954]' : 'hover:scale-105')} />
            </button>
          </div>

          {/* Center Column: Player Controls + Progress Bar */}
          <div className="flex flex-col items-center gap-2 w-full max-w-[500px] justify-self-center">
            {/* Control buttons */}
            <div className="flex items-center gap-5">
              <button
                onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
                className={cn('text-[#B3B3B3] hover:text-white transition-colors', isShuffle && 'text-[#1DB954] hover:text-[#1ed760]')}
              >
                <Shuffle size={16} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); skipToPrevious(); }} className="text-[#B3B3B3] hover:text-white transition-colors">
                <SkipBack size={18} fill="currentColor" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                {isPlaying ? <Pause size={16} className="text-black" fill="currentColor" /> : <Play size={16} className="text-black ml-0.5" fill="currentColor" />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); skipToNext(); }} className="text-[#B3B3B3] hover:text-white transition-colors">
                <SkipForward size={18} fill="currentColor" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleRepeat(); }}
                className={cn('text-[#B3B3B3] hover:text-white transition-colors', isRepeat && 'text-[#1DB954] hover:text-[#1ed760]')}
              >
                {isRepeat ? <Repeat1 size={16} /> : <Repeat size={16} />}
              </button>
            </div>

            {/* Playback progress bar */}
            <div className="flex items-center gap-3 w-full text-[11px] text-[#B3B3B3]" onClick={(e) => e.stopPropagation()}>
              <span>{formatTime(position)}</span>
              <Slider
                value={[position]}
                max={duration || 100}
                step={0.5}
                onValueChange={(val) => seekTo(Array.isArray(val) ? val[0] : val)}
                className="flex-1"
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Column: Volume + Fullscreen */}
          <div className="flex items-center justify-end gap-3 min-w-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 group/vol w-32">
              <button onClick={handleToggleMute} className="text-[#B3B3B3] hover:text-white transition-colors">
                {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <Slider
                value={[volume]}
                max={1}
                step={0.05}
                onValueChange={(val) => setVolume(Array.isArray(val) ? val[0] : val)}
                className="flex-1"
              />
            </div>
            <button
              onClick={() => setShowFullPlayer(true)}
              className="p-2 text-[#B3B3B3] hover:text-white transition-colors"
              title="Fullscreen"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <FullPlayerModal open={showFullPlayer} onClose={() => setShowFullPlayer(false)} />
    </>
  );
}
