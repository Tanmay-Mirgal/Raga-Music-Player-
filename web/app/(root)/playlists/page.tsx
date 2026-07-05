'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAudio, Track } from '@/components/AudioProvider';
import {
  getPlaylists, createPlaylist, deletePlaylist,
  renamePlaylist, addSongToPlaylist, removeSongFromPlaylist,
  searchSongs, toTrack, getImageUrl, logInteraction,
} from '@/lib/api';
import TrackRow from '@/components/TrackRow';
import TrackOptionsMenu from '@/components/TrackOptionsMenu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Music2, Search, Play, Trash2, Edit3, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PlaylistsPage() {
  const { user } = useUser();
  const { playTrack, currentTrack, isPlaying, logInteraction: logInt } = useAudio();

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [renameName, setRenameName] = useState('');

  // In-playlist search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const loadPlaylists = useCallback(async () => {
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
    loadPlaylists();
  }, [loadPlaylists]);

  // Debounced search for adding songs
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) { setSearchResults([]); return; }
      setSearching(true);
      try {
        const data = await searchSongs(searchQuery, 10);
        setSearchResults(data);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreatePlaylist = async () => {
    if (!newName.trim() || !user) return;
    try {
      const playlist = await createPlaylist(user.id, newName.trim());
      if (playlist) {
        setPlaylists((prev) => [...prev, playlist]);
        toast(`Playlist "${newName.trim()}" created!`);
      }
      setShowCreateDialog(false);
      setNewName('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Delete this playlist?')) return;
    const res = await deletePlaylist(playlistId);
    if (res.ok) {
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
      setSelectedPlaylist(null);
      toast('Playlist deleted');
    }
  };

  const handleRenamePlaylist = async () => {
    if (!selectedPlaylist || !renameName.trim()) return;
    const res = await renamePlaylist(selectedPlaylist.id, renameName.trim());
    if (res.ok) {
      const updated = { ...selectedPlaylist, name: renameName.trim(), title: renameName.trim() };
      setSelectedPlaylist(updated);
      setPlaylists((prev) => prev.map((p) => p.id === selectedPlaylist.id ? updated : p));
      toast('Playlist renamed');
    }
    setShowRenameDialog(false);
    setRenameName('');
  };

  const handleAddSong = async (song: any) => {
    if (!selectedPlaylist || !user) return;
    if (selectedPlaylist.tracks.some((t: any) => t.id === song.id)) {
      toast('Song is already in this playlist');
      return;
    }
    const track = toTrack(song);
    const res = await addSongToPlaylist(selectedPlaylist.id, track);
    if (res.ok) {
      const updatedTracks = [...selectedPlaylist.tracks, track];
      const updatedPl = { ...selectedPlaylist, tracks: updatedTracks };
      setSelectedPlaylist(updatedPl);
      setPlaylists((prev) => prev.map((p) => p.id === selectedPlaylist.id ? updatedPl : p));
      await logInteraction(user.id, track, 'playlist_add');
      toast(`Added "${track.name}" to playlist`);
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!selectedPlaylist) return;
    const res = await removeSongFromPlaylist(selectedPlaylist.id, songId);
    if (res.ok) {
      const updatedTracks = selectedPlaylist.tracks.filter((t: any) => t.id !== songId);
      const updatedPl = { ...selectedPlaylist, tracks: updatedTracks };
      setSelectedPlaylist(updatedPl);
      setPlaylists((prev) => prev.map((p) => p.id === selectedPlaylist.id ? updatedPl : p));
    }
  };

  const coverImage = (pl: any) =>
    pl.coverImageUrl || pl.tracks?.[0]?.image?.[1]?.url || pl.tracks?.[0]?.image?.[0]?.url;

  return (
    <div className="min-h-screen bg-[#121212] px-4 sm:px-6 pt-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white font-black text-2xl">Playlists</h1>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="w-10 h-10 rounded-full bg-[#282828] flex items-center justify-center text-white hover:bg-[#333] transition-colors"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 bg-white/10 rounded-md" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && playlists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Music2 size={64} className="text-[#535353] mb-4" />
          <p className="text-white font-bold text-lg mb-2">Create your first playlist</p>
          <p className="text-[#B3B3B3] text-sm mb-8">It's easy, we'll help you.</p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-white text-black hover:bg-white/90 font-bold rounded-full px-8"
          >
            Create Playlist
          </Button>
        </div>
      )}

      {/* Playlists list */}
      {!loading && playlists.length > 0 && (
        <div className="space-y-1">
          {playlists.map((pl) => {
            const img = coverImage(pl);
            return (
              <button
                key={pl.id}
                onClick={() => {
                  setSelectedPlaylist(pl);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors group"
              >
                <div className="w-14 h-14 rounded-md bg-[#282828] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {img ? (
                    <img src={img} alt={pl.name} className="w-full h-full object-cover" />
                  ) : (
                    <Music2 size={24} className="text-[#B3B3B3]" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white font-bold text-sm truncate">{pl.name}</p>
                  <p className="text-[#B3B3B3] text-xs mt-0.5">
                    Playlist • {pl.tracks?.length || 0} songs
                  </p>
                </div>
                <ChevronRight size={18} className="text-[#B3B3B3] group-hover:text-white transition-colors" />
              </button>
            );
          })}
        </div>
      )}

      {/* Create Playlist Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#1E1E1E] border-[#3E3E3E] text-white">
          <DialogHeader>
            <DialogTitle>New Playlist</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. My Vibe Mix"
            className="bg-[#2A2A2A] border-[#3E3E3E] text-white placeholder:text-[#7A7A7A]"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-white hover:bg-white/10">Cancel</Button>
            <Button onClick={handleCreatePlaylist} disabled={!newName.trim()} className="bg-[#1DB954] text-black hover:bg-[#1ed760]">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="bg-[#1E1E1E] border-[#3E3E3E] text-white">
          <DialogHeader>
            <DialogTitle>Rename Playlist</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Enter new name"
            className="bg-[#2A2A2A] border-[#3E3E3E] text-white placeholder:text-[#7A7A7A]"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleRenamePlaylist()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRenameDialog(false)} className="text-white hover:bg-white/10">Cancel</Button>
            <Button onClick={handleRenamePlaylist} disabled={!renameName.trim()} className="bg-[#1DB954] text-black hover:bg-[#1ed760]">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Playlist Detail Sheet */}
      <Sheet open={!!selectedPlaylist} onOpenChange={(o) => { if (!o) setSelectedPlaylist(null); }}>
        <SheetContent side="right" className="bg-[#121212] border-[#282828] text-white w-full sm:max-w-lg p-0">
          {selectedPlaylist && (
            <>
              {/* Hero gradient header */}
              <div
                className="px-6 pt-10 pb-5 relative"
                style={{ background: 'linear-gradient(180deg, #2D46B9 0%, #121212 100%)' }}
              >
                {/* Actions */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <button onClick={() => setSelectedPlaylist(null)} className="text-white/70 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setRenameName(selectedPlaylist.name); setShowRenameDialog(true); }} className="text-white/70 hover:text-white transition-colors">
                      <Edit3 size={20} />
                    </button>
                    <button onClick={() => handleDeletePlaylist(selectedPlaylist.id)} className="text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Cover */}
                <div className="flex justify-center mb-4">
                  <div className="w-36 h-36 rounded-xl overflow-hidden bg-[#282828] shadow-2xl">
                    {coverImage(selectedPlaylist) ? (
                      <img src={coverImage(selectedPlaylist)} alt={selectedPlaylist.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 size={48} className="text-[#535353]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info + Play */}
                <div className="text-center mb-4">
                  <h2 className="text-white font-black text-xl">{selectedPlaylist.name}</h2>
                  <p className="text-white/50 text-sm mt-1">
                    Playlist • {user?.firstName} • {selectedPlaylist.tracks?.length || 0} songs
                  </p>
                </div>

                {selectedPlaylist.tracks?.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        const tracks = selectedPlaylist.tracks.map(toTrack);
                        playTrack(tracks[0], tracks);
                      }}
                      className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center hover:bg-[#1ed760] transition-colors shadow-lg"
                    >
                      <Play size={20} className="text-black ml-0.5" fill="currentColor" />
                    </button>
                  </div>
                )}
              </div>

              {/* Add songs search */}
              <div className="px-4 py-3 border-b border-white/5">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7A7A]" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search to add songs..."
                    className="pl-9 pr-9 h-10 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#7A7A7A] text-sm"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B3B3B3]">
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Search results for adding */}
                {searching && <div className="text-center py-3 text-[#B3B3B3] text-xs">Searching...</div>}
                {!searching && searchResults.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {searchResults.map((song) => {
                      const img = getImageUrl(song.image, 'mid');
                      return (
                        <div key={song.id} className="flex items-center gap-2 py-1.5">
                          <div className="w-8 h-8 rounded bg-[#282828] overflow-hidden flex-shrink-0">
                            {img && <img src={img} alt={song.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-bold truncate">{song.name}</p>
                            <p className="text-[#B3B3B3] text-xs truncate">{song.artists?.primary?.[0]?.name}</p>
                          </div>
                          <button
                            onClick={() => handleAddSong(song)}
                            className="text-[#1DB954] hover:text-[#1ed760] transition-colors p-1"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tracks list */}
              <ScrollArea className="h-[calc(100vh-500px)]">
                <div className="px-4 py-2">
                  {selectedPlaylist.tracks?.length === 0 ? (
                    <div className="text-center py-16">
                      <Music2 size={40} className="text-[#535353] mx-auto mb-3" />
                      <p className="text-[#B3B3B3] text-sm">This playlist is empty. Search and add songs above!</p>
                    </div>
                  ) : (
                    selectedPlaylist.tracks?.map((track: any) => (
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
                        onRemove={() => handleRemoveSong(track.id)}
                      />
                    ))
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
