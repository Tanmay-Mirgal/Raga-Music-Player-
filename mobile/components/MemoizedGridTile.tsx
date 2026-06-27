import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  id: string;
  name: string;
  imageUrl?: string;
  isCurrent: boolean;
  onPress: () => void;
  onMenuPress?: () => void;
}

const GridTile = ({ id, name, imageUrl, isCurrent, onPress, onMenuPress }: Props) => {
  const isLikedSongs = id === 'liked_songs';
  const isDownloadedSongs = id === 'downloaded_songs';

  return (
    <TouchableOpacity
      style={styles.gridTile}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {isLikedSongs ? (
        <LinearGradient
          colors={['#3700B3', '#121212']}
          style={styles.gridGradient}
        >
          <Ionicons name="heart" size={22} color="#FF2D55" />
        </LinearGradient>
      ) : isDownloadedSongs ? (
        <LinearGradient
          colors={['#004B87', '#121212']}
          style={styles.gridGradient}
        >
          <Ionicons name="download" size={22} color="#1DB954" />
        </LinearGradient>
      ) : imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.gridImage} />
      ) : (
        <View style={styles.gridIconPlaceholder}>
          <Ionicons name="musical-notes" size={22} color="#B3B3B3" />
        </View>
      )}
      <View style={styles.gridTitleWrapper}>
        <Text style={[styles.gridTitle, isCurrent && styles.activeText]} numberOfLines={2}>
          {name}
        </Text>
      </View>
      {!isLikedSongs && !isDownloadedSongs && onMenuPress && (
        <TouchableOpacity onPress={onMenuPress} style={styles.ellipsisBtn}>
          <Ionicons name="ellipsis-vertical" size={16} color="#B3B3B3" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const areEqual = (prev: Props, next: Props) =>
  prev.id === next.id &&
  prev.isCurrent === next.isCurrent &&
  prev.name === next.name &&
  prev.imageUrl === next.imageUrl;

export const MemoizedGridTile = memo(GridTile, areEqual);

const styles = StyleSheet.create({
  gridTile: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  gridImage: {
    width: 56,
    height: 56,
    backgroundColor: '#282828',
  },
  gridGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridIconPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridTitleWrapper: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  gridTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeText: {
    color: '#1DB954',
  },
  ellipsisBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
