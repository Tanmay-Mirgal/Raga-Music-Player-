'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from './AudioProvider';
import { fetchLyrics } from '@/lib/api';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Heart, MoreHorizontal, ChevronDown, ListMusic, Mic2, Timer,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TrackOptionsMenu from './TrackOptionsMenu';
import { toast } from 'sonner';

interface FullPlayerModalProps {
  open: boolean;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// HSL color from track id
function getDominantColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 45%, 18%)`;
}

const SLEEP_OPTIONS = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
];

export default function FullPlayerModal({ open, onClose }: FullPlayerModalProps) {
  const {
    currentTrack, isPlaying, position, duration,
    togglePlay, seekTo, skipToNext, skipToPrevious,
    isShuffle, isRepeat, toggleShuffle, toggleRepeat,
    likedSongs, toggleLikeTrack, queue, currentIndex,
  } = useAudio();

  const [lyricsLines, setLyricsLines] = useState<{ time: number; text: string }[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);
  const sleepRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'lyrics'>('queue');

  const bgColor = currentTrack ? getDominantColor(currentTrack.id) : '#121212';
  const isLiked = currentTrack ? likedSongs.some((t) => t.id === currentTrack.id) : false;
  const imageUrl = currentTrack?.image?.[2]?.url || currentTrack?.image?.[1]?.url || '';
  const artistName = currentTrack?.artists?.primary?.[0]?.name || 'Unknown Artist';
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  // Fetch lyrics when tab is opened or track changes
  useEffect(() => {
    if (!currentTrack || activeTab !== 'lyrics') return;
    setLyricsLoading(true);
    setLyricsLines([]);
    setPlainLyrics(null);

    fetchLyrics(currentTrack.name, artistName).then((data) => {
      if (!data) { setLyricsLoading(false); return; }
      if (data.syncedLyrics) {
        const lines = data.syncedLyrics
          .split('\n')
          .map((line: string) => {
            const m = line.match(/^\[(\d+):(\d+\.\d+)\](.*)/);
            if (!m) return null;
            const time = parseInt(m[1]) * 60 + parseFloat(m[2]);
            return { time, text: m[3].trim() };
          })
          .filter(Boolean);
        setLyricsLines(lines);
      } else if (data.plainLyrics) {
        setPlainLyrics(data.plainLyrics);
      }
      setLyricsLoading(false);
    }).catch(() => setLyricsLoading(false));
  }, [currentTrack?.id, activeTab]);

  // Find current lyric line
  const currentLyricIdx = lyricsLines.reduce((best, line, i) => {
    return line.time <= position ? i : best;
  }, -1);

  const setSleepTimer = (minutes: number) => {
    if (sleepRef.current) clearTimeout(sleepRef.current);
    setSleepTimerSeconds(minutes * 60);
    sleepRef.current = setTimeout(() => {
      togglePlay();
      setSleepTimerSeconds(null);
      toast('Sleep timer: music paused');
    }, minutes * 60 * 1000);
    toast(`Sleep timer set for ${minutes} minutes`);
    setShowSleepTimer(false);
  };

  if (!currentTrack) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-none w-full h-full sm:max-w-2xl sm:h-auto border-none p-0 overflow-hidden rounded-none sm:rounded-2xl"
        style={{ background: `linear-gradient(180deg, ${bgColor} 0%, #121212 100%)` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <ChevronDown size={28} />
          </button>
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Now Playing</p>
          <TrackOptionsMenu track={currentTrack} open={menuOpen} onOpenChange={setMenuOpen} />
          <button onClick={() => setMenuOpen(true)} className="text-white/70 hover:text-white transition-colors p-1">
            <span className="sr-only">More options</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </div>

        {/* Album Art */}
        <div className="px-8 py-4 flex justify-center">
          <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-xl overflow-hidden shadow-2xl">
            {imageUrl ? (
              <img src={imageUrl} alt={currentTrack.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#282828]" />
            )}
          </div>
        </div>

        {/* Track Info + Like */}
        <div className="flex items-center justify-between px-6 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-xl truncate">{currentTrack.name}</p>
            <p className="text-white/60 text-sm truncate mt-0.5">{artistName}</p>
          </div>
          <button
            onClick={() => toggleLikeTrack(currentTrack)}
            className="ml-4 p-2"
          >
            <Heart
              size={24}
              className={cn('transition-colors', isLiked ? 'text-[#1DB954] fill-[#1DB954]' : 'text-white/60 hover:text-white')}
            />
          </button>
        </div>

        {/* Seek Bar */}
        <div className="px-6 py-2">
          <Slider
            value={[position]}
            max={duration || 100}
            step={0.5}
            onValueChange={(val) => seekTo(Array.isArray(val) ? val[0] : (val as number))}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <span className="text-white/50 text-xs">{formatTime(position)}</span>
            <span className="text-white/50 text-xs">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-6 py-3">
          <button
            onClick={toggleShuffle}
            className={cn('p-2 transition-colors', isShuffle ? 'text-[#1DB954]' : 'text-white/60 hover:text-white')}
          >
            <Shuffle size={22} />
          </button>

          <button onClick={skipToPrevious} className="p-2 text-white hover:text-white/80 transition-colors">
            <SkipBack size={28} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <Pause size={28} className="text-black" fill="currentColor" />
            ) : (
              <Play size={28} className="text-black ml-1" fill="currentColor" />
            )}
          </button>

          <button onClick={skipToNext} className="p-2 text-white hover:text-white/80 transition-colors">
            <SkipForward size={28} fill="currentColor" />
          </button>

          <button
            onClick={toggleRepeat}
            className={cn('p-2 transition-colors', isRepeat ? 'text-[#1DB954]' : 'text-white/60 hover:text-white')}
          >
            {isRepeat ? <Repeat1 size={22} /> : <Repeat size={22} />}
          </button>
        </div>

        {/* Bottom Tabs — Queue / Lyrics / Sleep Timer */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="bg-white/10 border-none">
                <TabsTrigger value="queue" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-white/20 gap-1.5">
                  <ListMusic size={14} />
                  Queue
                </TabsTrigger>
                <TabsTrigger value="lyrics" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-white/20 gap-1.5">
                  <Mic2 size={14} />
                  Lyrics
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <button
              onClick={() => setShowSleepTimer(!showSleepTimer)}
              className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-colors',
                sleepTimerSeconds ? 'text-[#1DB954] bg-[#1DB954]/15' : 'text-white/50 hover:text-white hover:bg-white/10'
              )}
            >
              <Timer size={14} />
              {sleepTimerSeconds ? `${Math.ceil(sleepTimerSeconds / 60)}m left` : 'Sleep'}
            </button>
          </div>

          {/* Sleep timer picker */}
          {showSleepTimer && (
            <div className="flex flex-wrap gap-2 mb-3">
              {SLEEP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSleepTimer(opt.value)}
                  className="px-3 py-1.5 rounded-full bg-white/10 text-white text-xs hover:bg-white/20 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Queue */}
          {activeTab === 'queue' && (
            <ScrollArea className="h-44">
              {queue.map((track, i) => {
                const img = track.image?.[0]?.url || '';
                const isCur = i === currentIndex;
                return (
                  <div key={`${track.id}-${i}`} className={cn(
                    'flex items-center gap-3 py-2 px-1 rounded-md',
                    isCur && 'bg-white/5'
                  )}>
                    <div className="w-8 h-8 rounded bg-[#282828] overflow-hidden flex-shrink-0">
                      {img && <img src={img} alt={track.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-xs font-semibold truncate', isCur ? 'text-[#1DB954]' : 'text-white')}>
                        {track.name}
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        {track.artists?.primary?.[0]?.name}
                      </p>
                    </div>
                    {isCur && (
                      <div className="flex gap-0.5">
                        {[0,1,2].map((b) => (
                          <div key={b} className="w-0.5 bg-[#1DB954] rounded-full animate-bounce"
                            style={{ height: '12px', animationDelay: `${b * 0.15}s` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </ScrollArea>
          )}

          {/* Lyrics */}
          {activeTab === 'lyrics' && (
            <ScrollArea className="h-44">
              {lyricsLoading ? (
                <div className="flex items-center justify-center h-32 text-white/40 text-sm">Loading lyrics...</div>
              ) : lyricsLines.length > 0 ? (
                <div className="space-y-1">
                  {lyricsLines.map((line, i) => (
                    <p key={i} className={cn(
                      'text-sm py-0.5 transition-all duration-300',
                      i === currentLyricIdx
                        ? 'text-white font-bold text-base'
                        : i < currentLyricIdx
                        ? 'text-white/30'
                        : 'text-white/50'
                    )}>
                      {line.text || '♪'}
                    </p>
                  ))}
                </div>
              ) : plainLyrics ? (
                <p className="text-white/70 text-sm whitespace-pre-line leading-relaxed">{plainLyrics}</p>
              ) : (
                <div className="flex items-center justify-center h-32 text-white/30 text-sm">No lyrics found</div>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
