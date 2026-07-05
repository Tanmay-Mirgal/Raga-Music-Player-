'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAudio } from '@/components/AudioProvider';
import {
  syncUser, getUserPreferences, saveUserPreferences,
  getPlaylists, getRecommendations, searchSongs,
  toTrack, getImageUrl, capitalize,
} from '@/lib/api';
import GridTile from '@/components/GridTile';
import AlbumCard from '@/components/AlbumCard';
import TrackRow from '@/components/TrackRow';
import TrackOptionsMenu from '@/components/TrackOptionsMenu';
import PreferenceModal from '@/components/PreferenceModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Play } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Track } from '@/components/AudioProvider';

const LANGUAGE_OPTIONS = [
  { id: 'hin', name: 'Hindi', query: 'hindi', color: '#E61E32' },
  { id: 'eng', name: 'English', query: 'english', color: '#1E3264' },
  { id: 'pun', name: 'Punjabi', query: 'punjabi', color: '#B026FF' },
  { id: 'tel', name: 'Telugu', query: 'telugu', color: '#E8115B' },
  { id: 'tam', name: 'Tamil', query: 'tamil', color: '#31B057' },
  { id: 'mar', name: 'Marathi', query: 'marathi', color: '#FF6437' },
];

const GENRE_OPTIONS = [
  { id: 'lofi', name: 'Lofi & Chill', query: 'lofi' },
  { id: 'romance', name: 'Romantic Vibes', query: 'romantic' },
  { id: 'hiphop', name: 'Hip-Hop / Rap', query: 'hip hop' },
  { id: 'workout', name: 'Workout Power', query: 'workout' },
  { id: 'party', name: 'Party Hits', query: 'party' },
  { id: 'sad', name: 'Sad Songs', query: 'sad' },
];

interface ShelfData {
  title: string;
  songs: any[];
}

// Session cache
let cachedGridSongs: any[] = [];
let cachedShelves: ShelfData[] = [];
let cachedPlaylists: any[] = [];

export function clearHomeCache() {
  cachedGridSongs = [];
  cachedShelves = [];
  cachedPlaylists = [];
}

export default function HomePage() {
  const { user } = useUser();
  const { playTrack, currentTrack, isPlaying, likedSongs, toggleLikeTrack } = useAudio();

  const [loading, setLoading] = useState(true);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const [gridSongs, setGridSongs] = useState<any[]>(cachedGridSongs);
  const [shelves, setShelves] = useState<ShelfData[]>(cachedShelves);
  const [playlists, setPlaylists] = useState<any[]>(cachedPlaylists);

  // Menu track state
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);

  // Smart Mix
  const [smartMixLoading, setSmartMixLoading] = useState(false);

  // Liked Songs sheet
  const [showLikedSheet, setShowLikedSheet] = useState(false);

  const displayName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Listener';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return `Morning, ${displayName}`;
    if (h < 17) return `Afternoon, ${displayName}`;
    return `Evening, ${displayName}`;
  };

  const loadPersonalizedFeed = useCallback(async (languages: string[], genres: string[]) => {
    setLoading(true);
    const primaryLang = languages[0] || 'hindi';
    const secondaryLang = languages[1] || primaryLang;
    const primaryGenre = genres[0] || 'lofi';
    const secondaryGenre = genres[1] || 'romantic';

    try {
      const [gridResults, ...shelfResults] = await Promise.all([
        searchSongs(`${primaryLang} hits`, 6),
        searchSongs(`${primaryLang} ${primaryGenre}`, 6),
        searchSongs(`${primaryLang} ${secondaryGenre}`, 6),
        searchSongs(`${secondaryLang} ${primaryGenre}`, 6),
      ]);

      setGridSongs(gridResults);
      cachedGridSongs = gridResults;

      const fetchedShelves = [
        { title: `${capitalize(primaryLang)} ${capitalize(primaryGenre)}`, songs: shelfResults[0] },
        { title: `${capitalize(primaryLang)} ${capitalize(secondaryGenre)}`, songs: shelfResults[1] },
        { title: `${capitalize(secondaryLang)} ${capitalize(primaryGenre)}`, songs: shelfResults[2] },
      ].filter((s) => s.songs.length > 0);

      setShelves(fetchedShelves);
      cachedShelves = fetchedShelves;
      setShowPreferenceModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPreferencesAndLoad = useCallback(async () => {
    if (!user) return;

    // Use cache if available
    if (cachedGridSongs.length > 0 && cachedShelves.length > 0) {
      setLoading(false);
      getPlaylists(user.id).then((data) => { setPlaylists(data); cachedPlaylists = data; });
      return;
    }

    try {
      setLoading(true);
      await syncUser({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.imageUrl,
      });

      const [prefs, playlistData] = await Promise.all([
        getUserPreferences(user.id),
        getPlaylists(user.id),
      ]);

      setPlaylists(playlistData);
      cachedPlaylists = playlistData;

      if (prefs?.languages?.length >= 1 && prefs?.genres?.length >= 2) {
        setSelectedLanguages(prefs.languages);
        setSelectedGenres(prefs.genres);
        await loadPersonalizedFeed(prefs.languages, prefs.genres);
      } else {
        const localFlag = localStorage.getItem('raga_has_prefs');
        if (localFlag === 'true') {
          await loadPersonalizedFeed(['hindi'], ['lofi', 'romantic']);
        } else {
          setShowPreferenceModal(true);
          setLoading(false);
        }
      }
    } catch (e) {
      console.error(e);
      await loadPersonalizedFeed(['hindi'], ['lofi', 'romantic']);
    }
  }, [user, loadPersonalizedFeed]);

  useEffect(() => {
    if (user) checkPreferencesAndLoad();
  }, [user, checkPreferencesAndLoad]);

  const handleSavePreferences = async () => {
    if (!user || selectedLanguages.length < 1 || selectedGenres.length < 2) return;
    try {
      setLoading(true);
      localStorage.setItem('raga_has_prefs', 'true');
      await saveUserPreferences(user.id, selectedLanguages, selectedGenres);
      await loadPersonalizedFeed(selectedLanguages, selectedGenres);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const playSmartMix = async () => {
    if (!user) return;
    setSmartMixLoading(true);
    try {
      const tracks = await getRecommendations(user.id);
      if (tracks.length > 0) {
        const formattedTracks = tracks.map(toTrack);
        playTrack(formattedTracks[0], formattedTracks);
        toast('🎵 Playing your Raga AI Smart Mix!');
      } else {
        toast('Add some liked songs to build your Smart Mix!');
      }
    } catch (e) {
      toast('Failed to generate recommendations');
    } finally {
      setSmartMixLoading(false);
    }
  };

  const handlePlaySong = (song: any, list: any[]) => {
    playTrack(toTrack(song), list.map(toTrack));
  };

  const getGridItems = () => {
    const items: any[] = [];

    items.push({
      id: 'liked_songs',
      name: 'Liked Songs',
      isCurrent: currentTrack && likedSongs.some((t) => t.id === currentTrack.id),
      onPress: () => setShowLikedSheet(true),
    });

    playlists.forEach((pl) => {
      if (items.length >= 6) return;
      items.push({
        id: pl.id,
        name: pl.name,
        imageUrl: pl.coverImageUrl || pl.tracks?.[0]?.image?.[1]?.url,
        isCurrent: currentTrack && pl.tracks?.some((t: any) => t.id === currentTrack.id),
        onPress: () => {
          if (pl.tracks?.length > 0) {
            const tracks = pl.tracks.map(toTrack);
            playTrack(tracks[0], tracks);
          } else {
            toast('This playlist is empty');
          }
        },
      });
    });

    gridSongs.forEach((song) => {
      if (items.length >= 6) return;
      items.push({
        id: song.id,
        name: song.name,
        imageUrl: getImageUrl(song.image, 'mid'),
        isCurrent: currentTrack?.id === song.id,
        onPress: () => handlePlaySong(song, gridSongs),
        song,
      });
    });

    return items.slice(0, 6);
  };

  const gridItems = getGridItems();

  return (
    <div className="min-h-screen bg-[#121212] px-4 sm:px-6 pt-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img src="/icon.png" alt="Raga Logo" className="w-6 h-6 object-contain" />
          {loading ? (
            <Skeleton className="h-6 w-40 bg-white/10" />
          ) : (
            <h1 className="text-white font-black text-xl">{getGreeting()}</h1>
          )}
        </div>
        {user?.imageUrl && (
          <img src={user.imageUrl} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
        )}
      </div>

      {/* AI Smart Mix Banner */}
      <button
        onClick={playSmartMix}
        disabled={smartMixLoading}
        className="w-full mb-6 rounded-xl overflow-hidden text-left relative"
        style={{ background: 'linear-gradient(135deg, #1DB954 0%, #191414 100%)' }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-white flex-shrink-0" />
            <div>
              <p className="text-white font-black text-base">Raga AI Smart Mix</p>
              <p className="text-white/70 text-xs mt-0.5">Personalized recommendations based on your taste</p>
            </div>
          </div>
          {smartMixLoading ? (
            <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Play size={20} className="text-white ml-0.5" fill="currentColor" />
            </div>
          )}
        </div>
      </button>

      {/* Quick Play Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-md bg-white/10" />
          ))}
        </div>
      ) : gridItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
          {gridItems.map((item) => (
            <GridTile
              key={item.id}
              id={item.id}
              name={item.name}
              imageUrl={item.imageUrl}
              isCurrent={!!item.isCurrent}
              onPress={item.onPress}
              onMenuPress={item.song ? () => setMenuTrack(toTrack(item.song)) : undefined}
            />
          ))}
        </div>
      )}

      {/* Personalized Shelves */}
      {loading ? (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-5 w-40 mb-4 bg-white/10" />
              <div className="flex gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex-shrink-0">
                    <Skeleton className="w-[140px] h-[140px] rounded-md mb-2 bg-white/10" />
                    <Skeleton className="h-3 w-28 mb-1 bg-white/10" />
                    <Skeleton className="h-3 w-20 bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {shelves.map((shelf, si) => (
            <div key={si}>
              <h2 className="text-white font-bold text-lg mb-4">{shelf.title}</h2>
              <div className="shelf-scroll">
                {shelf.songs.map((song) => (
                  <AlbumCard
                    key={song.id}
                    id={song.id}
                    name={song.name}
                    artist={song.artists?.primary?.[0]?.name || 'Artist'}
                    imageUrl={getImageUrl(song.image, 'high')}
                    onPress={() => handlePlaySong(song, shelf.songs)}
                    onMenuPress={() => setMenuTrack(toTrack(song))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preference Modal */}
      <PreferenceModal
        open={showPreferenceModal}
        selectedLanguages={selectedLanguages}
        selectedGenres={selectedGenres}
        onToggleLanguage={(q) => setSelectedLanguages((prev) =>
          prev.includes(q) ? prev.filter((l) => l !== q) : [...prev, q]
        )}
        onToggleGenre={(q) => setSelectedGenres((prev) =>
          prev.includes(q) ? prev.filter((g) => g !== q) : [...prev, q]
        )}
        onSave={handleSavePreferences}
        loading={loading}
      />

      {/* Track Options Menu (invisible trigger, controlled) */}
      {menuTrack && (
        <TrackOptionsMenu
          track={menuTrack}
          open={!!menuTrack}
          onOpenChange={(o) => { if (!o) setMenuTrack(null); }}
        />
      )}

      {/* Liked Songs Sheet */}
      <Sheet open={showLikedSheet} onOpenChange={setShowLikedSheet}>
        <SheetContent side="right" className="bg-[#121212] border-[#282828] text-white w-full sm:max-w-md p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/5">
            <SheetTitle className="text-white text-xl font-black">Liked Songs</SheetTitle>
            <p className="text-[#B3B3B3] text-sm">{likedSongs.length} songs</p>
          </SheetHeader>

          {likedSongs.length > 0 && (
            <div className="px-6 py-3 flex items-center justify-between border-b border-white/5">
              <span className="text-[#B3B3B3] text-sm">{likedSongs.length} songs</span>
              <button
                onClick={() => {
                  const tracks = likedSongs.map(toTrack);
                  playTrack(tracks[0], tracks);
                  setShowLikedSheet(false);
                }}
                className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center hover:bg-[#1ed760] transition-colors"
              >
                <Play size={18} className="text-black ml-0.5" fill="currentColor" />
              </button>
            </div>
          )}

          <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
            <div className="px-4 py-2">
              {likedSongs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-4xl mb-4">💚</div>
                  <p className="text-[#B3B3B3] text-sm">No liked songs yet. Tap the heart icon on any song!</p>
                </div>
              ) : (
                likedSongs.map((track) => (
                  <TrackRow
                    key={track.id}
                    id={track.id}
                    name={track.name}
                    artist={track.artists?.primary?.[0]?.name || 'Unknown Artist'}
                    imageUrl={getImageUrl(track.image, 'mid')}
                    isCurrent={currentTrack?.id === track.id}
                    isPlaying={isPlaying}
                    onPress={() => playTrack(track, likedSongs)}
                    onRemove={() => toggleLikeTrack(track)}
                    onMenuPress={() => setMenuTrack(track)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
