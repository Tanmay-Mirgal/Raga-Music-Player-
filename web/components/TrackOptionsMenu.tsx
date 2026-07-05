'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAudio, Track } from './AudioProvider';
import { getPlaylists, createPlaylist, addSongToPlaylist, logInteraction } from '@/lib/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heart, ListPlus, Plus, Share2, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TrackOptionsMenuProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TrackOptionsMenu({ track, open, onOpenChange }: TrackOptionsMenuProps) {
  const { user } = useUser();
  const { likedSongs, toggleLikeTrack } = useAudio();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const isLiked = track ? likedSongs.some((t) => t.id === track.id) : false;

  useEffect(() => {
    if (open && user && track) {
      getPlaylists(user.id).then(setPlaylists).catch(console.error);
      setShowPlaylistPicker(false);
    }
  }, [open, user, track]);

  const handleClose = () => {
    onOpenChange(false);
    setShowPlaylistPicker(false);
  };

  const handleLike = async () => {
    if (!track) return;
    await toggleLikeTrack(track);
    toast(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
    handleClose();
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!track || !user) return;
    const res = await addSongToPlaylist(playlistId, {
      id: track.id,
      name: track.name,
      artists: track.artists,
      image: track.image,
      downloadUrl: track.downloadUrl,
    });
    if (res.ok) {
      toast('Added to playlist');
      await logInteraction(user.id, track, 'playlist_add');
    }
    handleClose();
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim() || !user || !track) return;
    const playlist = await createPlaylist(user.id, newPlaylistName.trim());
    if (playlist) {
      await handleAddToPlaylist(playlist.id);
      setPlaylists((prev) => [...prev, playlist]);
    }
    setShowCreateDialog(false);
    setNewPlaylistName('');
    handleClose();
  };

  const handleCopyLink = () => {
    if (!track) return;
    navigator.clipboard.writeText(`${window.location.origin}?track=${track.id}`);
    toast('Link copied to clipboard');
    handleClose();
  };

  if (!track) return null;

  return (
    <>
      <Sheet open={open && !showPlaylistPicker} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <SheetContent side="bottom" showCloseButton={false} className="bg-[#282828] border-[#3E3E3E] text-white rounded-t-2xl">
          {/* Track info */}
          <div className="flex items-center gap-3 px-4 pb-4 border-b border-white/10 mb-2">
            {track.image?.[0]?.url && (
              <img src={track.image[0].url} alt={track.name} className="w-10 h-10 rounded object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm truncate">{track.name}</p>
              <p className="text-white/50 text-xs truncate">{track.artists?.primary?.[0]?.name}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="space-y-0.5">
            <button onClick={handleLike} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/5 rounded-md transition-colors text-left">
              <Heart size={20} className={cn(isLiked ? 'text-[#1DB954] fill-[#1DB954]' : 'text-white')} />
              <span className="text-white text-sm">{isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}</span>
            </button>

            <button onClick={() => setShowPlaylistPicker(true)} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/5 rounded-md transition-colors text-left">
              <ListPlus size={20} className="text-white" />
              <span className="text-white text-sm flex-1">Add to playlist</span>
              <ChevronRight size={16} className="text-white/40" />
            </button>

            <button onClick={handleCopyLink} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/5 rounded-md transition-colors text-left">
              <Share2 size={20} className="text-white" />
              <span className="text-white text-sm">Copy link</span>
            </button>
          </div>

          <div className="mt-4">
            <Button variant="ghost" onClick={handleClose} className="w-full text-[#B3B3B3] hover:text-white hover:bg-white/10 rounded-full">
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Playlist Picker Sheet */}
      <Sheet open={open && showPlaylistPicker} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <SheetContent side="bottom" showCloseButton={false} className="bg-[#282828] border-[#3E3E3E] text-white rounded-t-2xl max-h-[70vh]">
          <SheetHeader className="pb-3 border-b border-white/10 mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowPlaylistPicker(false)} className="text-white/60 hover:text-white">
                <ChevronLeft size={22} />
              </button>
              <SheetTitle className="text-white">Add to playlist</SheetTitle>
            </div>
          </SheetHeader>

          <div className="overflow-y-auto max-h-80 space-y-0.5">
            <button
              onClick={() => { setShowCreateDialog(true); setShowPlaylistPicker(false); }}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-md transition-colors text-left"
            >
              <div className="w-10 h-10 rounded bg-[#3E3E3E] flex items-center justify-center">
                <Plus size={18} className="text-white" />
              </div>
              <span className="text-white text-sm font-semibold">New playlist</span>
            </button>

            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleAddToPlaylist(pl.id)}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-md transition-colors text-left"
              >
                <div className="w-10 h-10 rounded bg-[#3E3E3E] overflow-hidden flex items-center justify-center flex-shrink-0">
                  {pl.coverImageUrl || pl.tracks?.[0]?.image?.[0]?.url ? (
                    <img src={pl.coverImageUrl || pl.tracks?.[0]?.image?.[0]?.url} alt={pl.name} className="w-full h-full object-cover" />
                  ) : (
                    <ListPlus size={16} className="text-[#B3B3B3]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{pl.name}</p>
                  <p className="text-[#B3B3B3] text-xs">{pl.tracks?.length || 0} songs</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3">
            <Button variant="ghost" onClick={handleClose} className="w-full text-[#B3B3B3] hover:text-white hover:bg-white/10 rounded-full">
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Playlist Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#1E1E1E] border-[#3E3E3E] text-white">
          <DialogHeader>
            <DialogTitle>New Playlist</DialogTitle>
          </DialogHeader>
          <Input
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="e.g. My Vibe Mix"
            className="bg-[#2A2A2A] border-[#3E3E3E] text-white placeholder:text-[#7A7A7A]"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-white hover:bg-white/10">Cancel</Button>
            <Button onClick={handleCreateAndAdd} disabled={!newPlaylistName.trim()} className="bg-[#1DB954] text-black hover:bg-[#1ed760]">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
