'use client';

import React, { memo } from 'react';
import { Play, Pause, MoreHorizontal, Heart, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackRowProps {
  id: string;
  name: string;
  artist: string;
  imageUrl?: string;
  isCurrent: boolean;
  isPlaying: boolean;
  onPress: () => void;
  onMenuPress?: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

const TrackRow = memo(function TrackRow({
  id, name, artist, imageUrl, isCurrent, isPlaying,
  onPress, onMenuPress, onRemove, showRemove
}: TrackRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-2 py-2 rounded-md group cursor-pointer transition-colors',
        isCurrent ? 'bg-white/5' : 'hover:bg-white/5'
      )}
      onClick={onPress}
    >
      {/* Thumbnail */}
      <div className="relative w-12 h-12 flex-shrink-0 rounded bg-[#282828] overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play size={16} className="text-[#B3B3B3]" />
          </div>
        )}
        {/* Overlay play indicator */}
        <div className={cn(
          'absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity',
          isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}>
          {isCurrent && isPlaying ? (
            <Pause size={16} className="text-white" />
          ) : (
            <Play size={16} className="text-white ml-0.5" />
          )}
        </div>
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-semibold truncate',
          isCurrent ? 'text-[#1DB954]' : 'text-white'
        )}>
          {name}
        </p>
        <p className="text-xs text-[#B3B3B3] truncate mt-0.5">{artist}</p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-2 rounded-full hover:bg-white/10 text-[#B3B3B3] hover:text-white transition-colors"
            title="Remove"
          >
            <Minus size={16} />
          </button>
        )}
        {onMenuPress && (
          <button
            onClick={onMenuPress}
            className="p-2 rounded-full hover:bg-white/10 text-[#B3B3B3] hover:text-white transition-colors"
            title="More options"
          >
            <MoreHorizontal size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

export default TrackRow;
