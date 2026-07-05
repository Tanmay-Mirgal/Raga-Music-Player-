'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useAudio, Track } from '@/components/AudioProvider';
import { getPlaylists, saveUserPreferences, toTrack, getImageUrl } from '@/lib/api';
import TrackRow from '@/components/TrackRow';
import TrackOptionsMenu from '@/components/TrackOptionsMenu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Music2, LogOut, RefreshCcw, ChevronRight, Play } from 'lucide-react';
import { toast } from 'sonner';
import { clearHomeCache } from '../page';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { playTrack, currentTrack, isPlaying, likedSongs } = useAudio();

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);

  const displayName = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Raga Listener';
  const email = user?.emailAddresses?.[0]?.emailAddress || '';
  const initials = displayName.charAt(0).toUpperCase();

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getPlaylists(user.id);
      setPlaylists(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogOut = async () => {
    if (!confirm('Are you sure you want to sign out from Raga?')) return;
    await signOut({ redirectUrl: '/sign-in' });
  };

  const handleResetPreferences = async () => {
    if (!user) return;
    if (!confirm('Reset your music preferences? This will show the preference setup again.')) return;
    try {
      localStorage.removeItem('raga_has_prefs');
      clearHomeCache();
      await saveUserPreferences(user.id, [], []);
      toast('Preferences reset! Redirecting to Home...');
      router.replace('/');
    } catch (e) {
      console.error(e);
    }
  };

  const coverImage = (pl: any) =>
    pl.coverImageUrl || pl.tracks?.[0]?.image?.[1]?.url;

  return (
    <div className="min-h-screen bg-[#121212] pb-32">
      {/* Profile Header */}
      <div className="px-4 sm:px-6 pt-12 pb-8 flex flex-col items-center">
        <Avatar className="w-24 h-24 mb-4 ring-4 ring-[#282828]">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback className="bg-[#1DB954] text-black font-black text-4xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-white font-black text-2xl text-center">{displayName}</h1>
        <p className="text-[#B3B3B3] text-sm mt-1">{email}</p>
      </div>

      {/* Stats Grid */}
      <div className="mx-4 sm:mx-6 mb-8 bg-[#181818] rounded-xl p-4 grid grid-cols-3 divide-x divide-white/10">
        <div className="text-center px-2">
          <p className="text-white font-black text-xl">{likedSongs.length}</p>
          <p className="text-[#B3B3B3] text-xs mt-1">Liked Songs</p>
        </div>
        <div className="text-center px-2">
          <p className="text-white font-black text-xl">{playlists.length}</p>
          <p className="text-[#B3B3B3] text-xs mt-1">Playlists</p>
        </div>
        <div className="text-center px-2">
          <p className="text-white font-black text-xl">∞</p>
          <p className="text-[#B3B3B3] text-xs mt-1">Streams</p>
        </div>
      </div>

      {/* My Playlists */}
      <div className="mb-8">
        <h2 className="text-white font-bold text-lg px-4 sm:px-6 mb-4">My Playlists</h2>
        {loading ? (
          <div className="px-4 sm:px-6 flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0">
                <Skeleton className="w-[110px] h-[110px] rounded-md mb-2 bg-white/10" />
                <Skeleton className="h-3 w-20 bg-white/10" />
              </div>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <p className="text-[#B3B3B3] text-sm px-4 sm:px-6">
            No playlists yet. Start organizing your hits!
          </p>
        ) : (
          <div className="shelf-scroll px-4 sm:px-6">
            {playlists.map((pl) => {
              const img = coverImage(pl);
              return (
                <button
                  key={pl.id}
                  onClick={() => setSelectedPlaylist(pl)}
                  className="flex-shrink-0 w-[110px] text-left"
                >
                  <div className="w-[110px] h-[110px] rounded-lg overflow-hidden bg-[#282828] mb-2 flex items-center justify-center">
                    {img ? (
                      <img src={img} alt={pl.name} className="w-full h-full object-cover" />
                    ) : (
                      <Music2 size={32} className="text-[#B3B3B3]" />
                    )}
                  </div>
                  <p className="text-white font-bold text-xs truncate">{pl.name}</p>
                  <p className="text-[#B3B3B3] text-xs">{pl.tracks?.length || 0} tracks</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Liked Songs quick access */}
      <div className="mb-8">
        <h2 className="text-white font-bold text-lg px-4 sm:px-6 mb-4">Liked Songs</h2>
        {likedSongs.length === 0 ? (
          <p className="text-[#B3B3B3] text-sm px-4 sm:px-6">
            No liked songs yet. Tap the ♥ icon on any track!
          </p>
        ) : (
          <div className="px-4 sm:px-6 space-y-0.5">
            {likedSongs.slice(0, 5).map((track) => (
              <TrackRow
                key={track.id}
                id={track.id}
                name={track.name}
                artist={track.artists?.primary?.[0]?.name || 'Unknown Artist'}
                imageUrl={getImageUrl(track.image, 'mid')}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying}
                onPress={() => playTrack(track, likedSongs)}
                onMenuPress={() => setMenuTrack(track)}
              />
            ))}
            {likedSongs.length > 5 && (
              <p className="text-[#B3B3B3] text-xs pt-2 pl-2">
                +{likedSongs.length - 5} more liked songs
              </p>
            )}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="px-4 sm:px-6 mb-8">
        <h2 className="text-white font-bold text-base mb-4">Settings</h2>
        <div className="rounded-xl bg-[#181818] overflow-hidden divide-y divide-white/5">
          <button
            onClick={handleResetPreferences}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <RefreshCcw size={20} className="text-white" />
              <span className="text-white text-sm font-medium">Update music preferences</span>
            </div>
            <ChevronRight size={18} className="text-[#B3B3B3]" />
          </button>

          <button
            onClick={handleLogOut}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut size={20} className="text-red-400" />
              <span className="text-red-400 text-sm font-medium">Log Out</span>
            </div>
            <ChevronRight size={18} className="text-[#B3B3B3]" />
          </button>
        </div>
      </div>

      {/* Playlist Detail Sheet */}
      <Sheet open={!!selectedPlaylist} onOpenChange={(o) => { if (!o) setSelectedPlaylist(null); }}>
        <SheetContent side="right" className="bg-[#121212] border-[#282828] text-white w-full sm:max-w-md p-0">
          {selectedPlaylist && (
            <>
              <SheetHeader className="px-6 pt-8 pb-4">
                <div className="flex justify-center mb-4">
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-[#282828]">
                    {coverImage(selectedPlaylist) ? (
                      <img src={coverImage(selectedPlaylist)} alt={selectedPlaylist.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 size={40} className="text-[#535353]" />
                      </div>
                    )}
                  </div>
                </div>
                <SheetTitle className="text-white text-center">{selectedPlaylist.name}</SheetTitle>
                <p className="text-[#B3B3B3] text-sm text-center">{selectedPlaylist.tracks?.length || 0} songs</p>
              </SheetHeader>

              {selectedPlaylist.tracks?.length > 0 && (
                <div className="px-6 pb-3 flex justify-end">
                  <button
                    onClick={() => {
                      const tracks = selectedPlaylist.tracks.map(toTrack);
                      playTrack(tracks[0], tracks);
                      setSelectedPlaylist(null);
                    }}
                    className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center hover:bg-[#1ed760] transition-colors"
                  >
                    <Play size={20} className="text-black ml-0.5" fill="currentColor" />
                  </button>
                </div>
              )}

              <ScrollArea className="flex-1 h-[calc(100vh-300px)]">
                <div className="px-4 py-2">
                  {selectedPlaylist.tracks?.map((track: any) => (
                    <TrackRow
                      key={track.id}
                      id={track.id}
                      name={track.name}
                      artist={track.artists?.primary?.[0]?.name || 'Unknown Artist'}
                      imageUrl={getImageUrl(track.image, 'mid')}
                      isCurrent={currentTrack?.id === track.id}
                      isPlaying={isPlaying}
                      onPress={() => playTrack(track, selectedPlaylist.tracks)}
                      onMenuPress={() => setMenuTrack(track)}
                    />
                  ))}
                  {selectedPlaylist.tracks?.length === 0 && (
                    <div className="text-center py-16">
                      <Music2 size={40} className="text-[#535353] mx-auto mb-3" />
                      <p className="text-[#B3B3B3] text-sm">Playlist is empty. Add songs from the Playlists tab!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Track Options */}
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
