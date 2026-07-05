'use client';

import React, { memo } from 'react';
import { Play, Heart, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GridTileProps {
  id: string;
  name: string;
  imageUrl?: string;
  isCurrent: boolean;
  onPress: () => void;
  onMenuPress?: () => void;
  isSpecial?: boolean; // For Liked Songs / Downloaded Songs tiles
}

const GridTile = memo(function GridTile({
  id, name, imageUrl, isCurrent, onPress, onMenuPress, isSpecial
}: GridTileProps) {
  const isLiked = id === 'liked_songs';
  const isDownloads = id === 'downloaded_songs';

  return (
    <div
      onClick={onPress}
      className={cn(
        'relative flex items-center gap-3 rounded-md overflow-hidden cursor-pointer group transition-all duration-200',
        'bg-[#1A1A1A] hover:bg-[#252525]',
        isCurrent && 'bg-[#1DB954]/15 hover:bg-[#1DB954]/20'
      )}
    >
      {/* Thumbnail / Icon */}
      <div className={cn(
        'w-12 h-12 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-l-md',
        isLiked ? 'bg-gradient-to-br from-[#4B0082] to-[#1DB954]' :
        isDownloads ? 'bg-gradient-to-br from-[#1565C0] to-[#0D47A1]' :
        'bg-[#282828]'
      )}>
        {(isLiked || isDownloads) ? (
          <Heart size={20} className="text-white" fill="white" />
        ) : imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#282828]">
            <Play size={16} className="text-[#B3B3B3]" />
          </div>
        )}
      </div>

      {/* Name */}
      <span className={cn(
        'flex-1 text-sm font-bold truncate pr-2',
        isCurrent ? 'text-[#1DB954]' : 'text-white'
      )}>
        {name}
      </span>

      {/* Play overlay on hover */}
      <div className={cn(
        'absolute right-2 w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg transition-all duration-200 transform',
        'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'
      )}>
        <Play size={14} className="text-black ml-0.5" fill="currentColor" />
      </div>
    </div>
  );
});

export default GridTile;
