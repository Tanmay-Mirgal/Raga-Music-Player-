'use client';

import React from 'react';
import { useAudio, Track } from './AudioProvider';
import { Play, Pause, Sparkles, Music2, Heart, Disc } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RightPanel() {
  const { currentTrack, isPlaying, queue, currentIndex, togglePlay, playTrack, likedSongs, toggleLikeTrack } = useAudio();

  const isLiked = currentTrack ? likedSongs.some((t) => t.id === currentTrack.id) : false;
  const imageUrl = currentTrack?.image?.[2]?.url || currentTrack?.image?.[1]?.url || '';
  const artistName = currentTrack?.artists?.primary?.[0]?.name || 'Unknown Artist';

  // Get next 3 songs in queue
  const getNextTracks = () => {
    if (!queue || queue.length <= 1) return [];
    const nextTracks: Track[] = [];
    let count = 0;
    let idx = currentIndex + 1;

    while (count < 3 && idx < queue.length) {
      if (queue[idx].id !== currentTrack?.id) {
        nextTracks.push(queue[idx]);
        count++;
      }
      idx++;
    }

    // Wrap around if queue is circular and we need more tracks
    if (count < 3 && queue.length > 1) {
      idx = 0;
      while (count < 3 && idx < currentIndex) {
        if (queue[idx].id !== currentTrack?.id && !nextTracks.some(t => t.id === queue[idx].id)) {
          nextTracks.push(queue[idx]);
          count++;
        }
        idx++;
      }
    }

    return nextTracks;
  };

  const nextTracks = getNextTracks();

  return (
    <aside className="hidden lg:flex flex-col fixed right-0 top-0 bottom-0 w-[300px] bg-[#0c0c0c] border-l border-white/5 z-40 p-6 pt-6 pb-28">
      {currentTrack ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-4 opacity-60">
            Now Playing
          </h2>

          {/* Large cover art */}
          <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-2xl bg-[#282828] mb-4 group">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={currentTrack.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 size={48} className="text-[#535353]" />
              </div>
            )}
            {/* Play Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                {isPlaying ? <Pause size={20} fill="currentColor" className="text-black" /> : <Play size={20} fill="currentColor" className="text-black ml-0.5" />}
              </button>
            </div>
          </div>

          {/* Track details (Heart inline with Title) */}
          <div className="flex flex-col min-w-0 mb-6">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-white font-black text-lg truncate hover:underline cursor-pointer">
                {currentTrack.name}
              </h3>
              <button
                onClick={() => toggleLikeTrack(currentTrack)}
                className="p-1 text-[#B3B3B3] hover:text-white transition-colors flex-shrink-0"
              >
                <Heart
                  size={18}
                  className={cn('transition-all', isLiked ? 'text-[#1DB954] fill-[#1DB954]' : 'hover:scale-110')}
                />
              </button>
            </div>
            <p className="text-sm text-[#B3B3B3] truncate mt-0.5 hover:text-white cursor-pointer">
              {artistName}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 w-full mb-5" />

          {/* Queue preview */}
          {nextTracks.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <h4 className="text-[#B3B3B3] text-xs font-bold uppercase tracking-wider mb-3">
                Next In Queue
              </h4>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {nextTracks.map((track, idx) => {
                  const trackImg = track.image?.[0]?.url || '';
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      onClick={() => playTrack(track, queue)}
                      className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded bg-[#282828] overflow-hidden flex-shrink-0 relative">
                        {trackImg ? (
                          <img src={trackImg} alt={track.name} className="w-full h-full object-cover" />
                        ) : (
                          <Music2 size={16} className="text-[#B3B3B3]" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play size={12} className="text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-[#1DB954]">
                          {track.name}
                        </p>
                        <p className="text-[10px] text-[#B3B3B3] truncate">
                          {track.artists?.primary?.[0]?.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty / Idle State */
        <div className="flex flex-col h-full items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Disc size={28} className="text-[#1DB954] animate-pulse" />
          </div>
          <h3 className="text-white font-bold text-sm mb-1">No Track Playing</h3>
          <p className="text-xs text-[#535353] max-w-[200px] leading-relaxed">
            Select a song, playlist, or try the AI Smart Mix to start playing.
          </p>

          {/* AI Banner inside Right Sidebar */}
          <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-[#1DB954]/10 to-transparent border border-[#1DB954]/20 w-full">
            <Sparkles size={20} className="text-[#1DB954] mx-auto mb-2" />
            <p className="text-white font-bold text-xs">AI Smart Mix</p>
            <p className="text-[10px] text-[#B3B3B3] mt-1">
              Personalized for your ears based on your vibe.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
