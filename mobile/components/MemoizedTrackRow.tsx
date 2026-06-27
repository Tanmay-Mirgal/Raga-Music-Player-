/**
 * MemoizedTrackRow
 * A React.memo-wrapped track list row used across Search and Playlist screens.
 * Only re-renders when id, isPlaying, or isCurrent changes — prevents mass
 * re-renders when the parent FlatList scrolls or the audio state updates.
 */
import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  id: string;
  name: string;
  artist: string;
  imageUrl?: string;
  isCurrent: boolean;
  isPlaying: boolean;
  onPress: () => void;
  onMenuPress: () => void;
  /** Optional: show a remove/× button instead of the 3-dot menu */
  onRemove?: () => void;
}

const TrackRow = ({
  name,
  artist,
  imageUrl,
  isCurrent,
  isPlaying,
  onPress,
  onMenuPress,
  onRemove,
}: Props) => (
  <View style={[styles.row, isCurrent && styles.activeRow]}>
    <TouchableOpacity
      style={styles.left}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.art} />
      ) : (
        <View style={[styles.art, styles.artPlaceholder]}>
          <Ionicons name="musical-note" size={20} color="#535353" />
        </View>
      )}

      <View style={styles.meta}>
        <Text
          style={[styles.trackName, isCurrent && styles.activeText]}
          numberOfLines={1}
        >
          {isCurrent && isPlaying ? '▶ ' : ''}{name}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {artist}
        </Text>
      </View>
    </TouchableOpacity>

    {onRemove ? (
      <TouchableOpacity onPress={onRemove} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color="#B3B3B3" />
      </TouchableOpacity>
    ) : (
      <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
        <Ionicons name="ellipsis-vertical" size={20} color="#B3B3B3" />
      </TouchableOpacity>
    )}
  </View>
);

// Custom equality check — only re-render when these props change
const areEqual = (prev: Props, next: Props) =>
  prev.id === next.id &&
  prev.isCurrent === next.isCurrent &&
  prev.isPlaying === next.isPlaying &&
  prev.name === next.name &&
  prev.imageUrl === next.imageUrl;

export const MemoizedTrackRow = memo(TrackRow, areEqual);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  activeRow: {
    backgroundColor: 'rgba(29, 185, 84, 0.05)',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  art: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  artPlaceholder: {
    backgroundColor: '#282828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    marginLeft: 14,
    paddingRight: 8,
  },
  trackName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeText: {
    color: '#1DB954',
  },
  artistName: {
    color: '#B3B3B3',
    fontSize: 12,
  },
  iconBtn: {
    padding: 12,
  },
});
