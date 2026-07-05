'use client';

import React, { memo } from 'react';
import { Play, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlbumCardProps {
  id: string;
  name: string;
  artist: string;
  imageUrl?: string;
  onPress: () => void;
  onMenuPress?: () => void;
}

const AlbumCard = memo(function AlbumCard({
  id, name, artist, imageUrl, onPress, onMenuPress
}: AlbumCardProps) {
  return (
    <div className="w-[140px] flex-shrink-0 cursor-pointer group" onClick={onPress}>
      {/* Cover */}
      <div className="relative w-[140px] h-[140px] rounded-md overflow-hidden bg-[#282828] mb-2">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play size={24} className="text-[#B3B3B3]" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
            <Play size={18} className="text-black ml-0.5" fill="currentColor" />
          </div>
        </div>
        {/* Menu button */}
        {onMenuPress && (
          <button
            onClick={(e) => { e.stopPropagation(); onMenuPress(); }}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>
      {/* Info */}
      <p className="text-sm font-semibold text-white truncate">{name}</p>
      <p className="text-xs text-[#B3B3B3] truncate mt-0.5">{artist}</p>
    </div>
  );
});

export default AlbumCard;
