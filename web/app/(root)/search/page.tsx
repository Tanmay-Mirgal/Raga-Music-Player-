'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAudio } from '@/components/AudioProvider';
import { searchSongs, toTrack, getImageUrl } from '@/lib/api';
import TrackRow from '@/components/TrackRow';
import TrackOptionsMenu from '@/components/TrackOptionsMenu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X, Disc3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Track } from '@/components/AudioProvider';

const CATEGORIES = [
  { id: '1', title: 'Romance', query: 'romantic hindi', color: '#E61E32' },
  { id: '2', title: 'Punjabi', query: 'punjabi pop', color: '#B026FF' },
  { id: '3', title: 'Bollywood Hits', query: 'bollywood hits', color: '#E8115B' },
  { id: '4', title: 'Lofi & Chill', query: 'lofi chill', color: '#1E3264' },
  { id: '5', title: 'Workout', query: 'gym workout', color: '#FF6437' },
  { id: '6', title: 'Hip-Hop', query: 'desi hip hop', color: '#BC438B' },
  { id: '7', title: 'Party Mood', query: 'party hits', color: '#31B057' },
  { id: '8', title: 'Relaxing', query: 'acoustic guitar', color: '#FFC862' },
];

const STORAGE_KEY = 'raga_recent_searches';
const MAX_RECENT = 10;

function loadRecent(): any[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveRecent(items: any[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
async function addRecent(track: any, current: any[]): Promise<any[]> {
  const updated = [track, ...current.filter((t) => t.id !== track.id)].slice(0, MAX_RECENT);
  saveRecent(updated);
  return updated;
}

export default function SearchPage() {
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await searchSongs(q, 15);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 450);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handlePlaySong = async (song: any) => {
    const track = toTrack(song);
    const updated = await addRecent(track, recent);
    setRecent(updated);
    playTrack(track, results.map(toTrack));
  };

  const handleSelectRecent = (track: any) => {
    playTrack(track, recent);
  };

  const handleRemoveRecent = (track: any) => {
    const updated = recent.filter((t) => t.id !== track.id);
    setRecent(updated);
    saveRecent(updated);
  };

  const handleClearAll = () => {
    setRecent([]);
    saveRecent([]);
  };

  const handleSelectCategory = (cat: typeof CATEGORIES[0]) => {
    setQuery(cat.query);
  };

  const showRecent = query.length === 0 && isFocused && recent.length > 0;

  return (
    <div className="min-h-screen bg-[#121212] px-4 sm:px-6 pt-6 pb-32">
      <h1 className="text-white font-black text-2xl mb-5">Search</h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#535353] z-10" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder="What do you want to listen to?"
          className="pl-10 pr-10 h-12 bg-white text-black placeholder:text-[#535353] border-0 rounded-md font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {query.length > 0 && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#535353] hover:text-black"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 bg-white/10 rounded-md" />
          ))}
        </div>
      )}

      {/* Search Results */}
      {!loading && query.length > 0 && (
        <div>
          {results.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-[#B3B3B3] text-sm">No results for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {results.map((song) => (
                <TrackRow
                  key={song.id}
                  id={song.id}
                  name={song.name}
                  artist={song.artists?.primary?.[0]?.name || 'Unknown Artist'}
                  imageUrl={getImageUrl(song.image, 'mid')}
                  isCurrent={currentTrack?.id === song.id}
                  isPlaying={isPlaying}
                  onPress={() => handlePlaySong(song)}
                  onMenuPress={() => setMenuTrack(toTrack(song))}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* No query — Recent or Categories */}
      {!loading && query.length === 0 && (
        <div>
          {showRecent ? (
            /* Recent searches */
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-base">Recently played</h2>
                <button
                  onClick={handleClearAll}
                  className="text-[#B3B3B3] text-sm font-semibold underline hover:text-white transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-0.5">
                {recent.map((track) => (
                  <TrackRow
                    key={track.id}
                    id={track.id}
                    name={track.name}
                    artist={track.artists?.primary?.[0]?.name || 'Unknown Artist'}
                    imageUrl={getImageUrl(track.image, 'mid')}
                    isCurrent={currentTrack?.id === track.id}
                    isPlaying={isPlaying}
                    onPress={() => handleSelectRecent(track)}
                    onMenuPress={() => {}}
                    onRemove={() => handleRemoveRecent(track)}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Browse Categories */
            <div>
              <h2 className="text-white font-bold text-base mb-4">Browse all</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat)}
                    className="relative h-24 rounded-lg p-3 text-left overflow-hidden hover:brightness-110 transition-all active:scale-95"
                    style={{ backgroundColor: cat.color }}
                  >
                    <span className="text-white font-bold text-sm z-10 relative w-3/4 block">{cat.title}</span>
                    <div className="absolute bottom-0 right-0 -translate-x-1 translate-y-1 opacity-20 rotate-[25deg]">
                      <Disc3 size={60} className="text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Track Options Menu */}
      {menuTrack && (
        <TrackOptionsMenu
          track={menuTrack}
          open={!!menuTrack}
          onOpenChange={(o) => { if (!o) setMenuTrack(null); }}
        />
      )}
    </div>
  );
}
