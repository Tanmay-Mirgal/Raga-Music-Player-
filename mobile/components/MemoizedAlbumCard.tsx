import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  id: string;
  name: string;
  artist: string;
  imageUrl: string;
  onPress: () => void;
  onMenuPress: () => void;
}

const AlbumCard = ({ name, artist, imageUrl, onPress, onMenuPress }: Props) => (
  <View style={styles.albumCard}>
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={{ uri: imageUrl }} style={styles.albumArt} />
    </TouchableOpacity>
    <View style={styles.albumMetaRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.albumTitle} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.albumArtist} numberOfLines={1}>
          {artist}
        </Text>
      </View>
      <TouchableOpacity onPress={onMenuPress} style={{ padding: 4 }}>
        <Ionicons name="ellipsis-vertical" size={14} color="#B3B3B3" />
      </TouchableOpacity>
    </View>
  </View>
);

const areEqual = (prev: Props, next: Props) =>
  prev.id === next.id &&
  prev.name === next.name &&
  prev.imageUrl === next.imageUrl;

export const MemoizedAlbumCard = memo(AlbumCard, areEqual);

const styles = StyleSheet.create({
  albumCard: {
    width: 140,
    marginRight: 16,
  },
  albumArt: {
    width: 140,
    height: 140,
    backgroundColor: '#282828',
    borderRadius: 4,
    marginBottom: 8,
  },
  albumMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  albumTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  albumArtist: {
    color: '#B3B3B3',
    fontSize: 12,
  },
});
