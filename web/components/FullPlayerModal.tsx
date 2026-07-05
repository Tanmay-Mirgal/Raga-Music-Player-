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
  Heart, ChevronDown, ListMusic, Mic2, Timer, X
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
  return `hsl(${h}, 45%, 15%)`;
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
  }, [currentTrack?.id, activeTab, artistName]);

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
        className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 max-w-none sm:max-w-none w-screen h-screen border-none p-0 overflow-hidden rounded-none m-0 flex flex-col justify-between z-50"
        style={{ background: `linear-gradient(180deg, ${bgColor} 0%, #0c0c0c 100%)` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 flex-shrink-0 z-10">
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <ChevronDown size={28} />
          </button>
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Now Playing</p>
          <div className="flex items-center gap-2">
            <TrackOptionsMenu track={currentTrack} open={menuOpen} onOpenChange={setMenuOpen} />
            <button onClick={() => setMenuOpen(true)} className="text-white/70 hover:text-white transition-colors p-1">
              <span className="sr-only">More options</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout - Expanded to true fullscreen view */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 px-6 md:px-12 py-4 md:py-6 items-center flex-1 max-w-6xl mx-auto w-full overflow-y-auto">
          
          {/* Left Column: Big Album Art */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-[360px] md:h-[360px] rounded-xl overflow-hidden shadow-2xl bg-[#282828] transition-transform duration-300 hover:scale-[1.02]">
              {imageUrl ? (
                <img src={imageUrl} alt={currentTrack.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          </div>

          {/* Right Column: Track details, controls and Queue/Lyrics */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6 h-full max-h-[500px]">
            
            {/* Track Info + Like Aligned Inline with Title */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-3">
                <p className="text-white font-black text-3xl md:text-4xl truncate leading-tight tracking-tight">{currentTrack.name}</p>
                <button
                  onClick={() => toggleLikeTrack(currentTrack)}
                  className="p-1 flex-shrink-0"
                >
                  <Heart
                    size={28}
                    className={cn('transition-all hover:scale-115', isLiked ? 'text-[#1DB954] fill-[#1DB954]' : 'text-white/60 hover:text-white')}
                  />
                </button>
              </div>
              <p className="text-white/60 text-base truncate mt-1.5">{artistName}</p>
            </div>

            {/* Seek Bar */}
            <div className="space-y-1">
              <Slider
                value={[position]}
                max={duration || 100}
                step={0.5}
                onValueChange={(val) => seekTo(Array.isArray(val) ? val[0] : (val as number))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/50 mt-1">
                <span>{formatTime(position)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Premium Spotify Controls Row */}
            <div className="flex items-center justify-between px-6 py-3 bg-white/5 rounded-xl">
              <button
                onClick={toggleShuffle}
                className={cn('p-2 transition-colors', isShuffle ? 'text-[#1DB954]' : 'text-white/60 hover:text-white')}
              >
                <Shuffle size={22} />
              </button>

              <button onClick={skipToPrevious} className="p-2 text-white hover:text-white/80 transition-colors">
                <SkipBack size={26} fill="currentColor" />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                {isPlaying ? (
                  <Pause size={28} className="text-black" fill="currentColor" />
                ) : (
                  <Play size={28} className="text-black ml-0.5" fill="currentColor" />
                )}
              </button>

              <button onClick={skipToNext} className="p-2 text-white hover:text-white/80 transition-colors">
                <SkipForward size={26} fill="currentColor" />
              </button>

              <button
                onClick={toggleRepeat}
                className={cn('p-2 transition-colors', isRepeat ? 'text-[#1DB954]' : 'text-white/60 hover:text-white')}
              >
                {isRepeat ? <Repeat1 size={22} /> : <Repeat size={22} />}
              </button>
            </div>

            {/* Bottom Tabs — Queue / Lyrics / Sleep Timer */}
            <div className="flex-1 flex flex-col min-h-0 bg-black/25 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="bg-white/10 border-none h-8 p-0.5">
                    <TabsTrigger value="queue" className="text-xs text-white/60 data-[state=active]:text-white data-[state=active]:bg-white/10 gap-1 h-7">
                      <ListMusic size={12} />
                      Queue
                    </TabsTrigger>
                    <TabsTrigger value="lyrics" className="text-xs text-white/60 data-[state=active]:text-white data-[state=active]:bg-white/10 gap-1 h-7">
                      <Mic2 size={12} />
                      Lyrics
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <button
                  onClick={() => setShowSleepTimer(!showSleepTimer)}
                  className={cn('flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-colors',
                    sleepTimerSeconds ? 'text-[#1DB954] bg-[#1DB954]/15' : 'text-white/50 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Timer size={12} />
                  {sleepTimerSeconds ? `${Math.ceil(sleepTimerSeconds / 60)}m left` : 'Sleep'}
                </button>
              </div>

              {/* Sleep timer picker */}
              {showSleepTimer && (
                <div className="flex flex-wrap gap-1.5 mb-3 bg-white/5 p-2 rounded-lg">
                  {SLEEP_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSleepTimer(opt.value)}
                      className="px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] hover:bg-white/20 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Queue Scroll List */}
              {activeTab === 'queue' && (
                <ScrollArea className="h-32 pr-2">
                  {queue.map((track, i) => {
                    const img = track.image?.[0]?.url || '';
                    const isCur = i === currentIndex;
                    return (
                      <div key={`${track.id}-${i}`} className={cn(
                        'flex items-center gap-3 py-1.5 px-2 rounded-md transition-colors',
                        isCur && 'bg-white/5'
                      )}>
                        <div className="w-8 h-8 rounded bg-[#282828] overflow-hidden flex-shrink-0">
                          {img && <img src={img} alt={track.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-xs font-semibold truncate', isCur ? 'text-[#1DB954]' : 'text-white')}>
                            {track.name}
                          </p>
                          <p className="text-[10px] text-white/40 truncate">
                            {track.artists?.primary?.[0]?.name}
                          </p>
                        </div>
                        {isCur && (
                          <div className="flex gap-0.5">
                            {[0,1,2].map((b) => (
                              <div key={b} className="w-0.5 bg-[#1DB954] rounded-full animate-bounce"
                                style={{ height: '10px', animationDelay: `${b * 0.15}s` }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </ScrollArea>
              )}

              {/* Lyrics Scroll view */}
              {activeTab === 'lyrics' && (
                <ScrollArea className="h-32 pr-2">
                  {lyricsLoading ? (
                    <div className="flex items-center justify-center h-24 text-white/40 text-xs">Loading lyrics...</div>
                  ) : lyricsLines.length > 0 ? (
                    <div className="space-y-1">
                      {lyricsLines.map((line, i) => (
                        <p key={i} className={cn(
                          'text-xs py-0.5 transition-all duration-300',
                          i === currentLyricIdx
                            ? 'text-white font-bold text-sm'
                            : i < currentLyricIdx
                            ? 'text-white/30'
                            : 'text-white/50'
                        )}>
                          {line.text || '♪'}
                        </p>
                      ))}
                    </div>
                  ) : plainLyrics ? (
                    <p className="text-white/70 text-xs whitespace-pre-line leading-relaxed">{plainLyrics}</p>
                  ) : (
                    <div className="flex items-center justify-center h-24 text-white/30 text-xs">No lyrics found</div>
                  )}
                </ScrollArea>
              )}
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
