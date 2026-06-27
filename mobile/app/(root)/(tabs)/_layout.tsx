import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, SafeAreaView, Dimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useAudio } from '../../../context/AudioContext';
import { LinearGradient } from 'expo-linear-gradient';
import TrackMenuModal from '../../../components/TrackMenuModal';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlay,
    seekTo,
    skipToNext,
    skipToPrevious,
    isShuffle,
    isRepeat,
    toggleShuffle,
    toggleRepeat,
    likedSongs,
    toggleLikeTrack,
  } = useAudio();

  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(width - 64);

  // States for the bottom-sheet Options Menu
  const [isTrackMenuVisible, setIsTrackMenuVisible] = useState(false);
  const [menuTrack, setMenuTrack] = useState<any>(null);

  // Time format helper
  const formatTime = (millis: number) => {
    if (isNaN(millis) || millis < 0) return '0:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const handleSliderTouch = (event: any) => {
    if (duration <= 0) return;
    const touchX = event.nativeEvent.locationX;
    const percent = Math.max(0, Math.min(1, touchX / sliderWidth));
    seekTo(percent * duration);
  };

  // Generate HSL color based on track ID for custom dynamic backgrounds
  const getDominantColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    // Dark dominant color (Saturation: 48%, Lightness: 13%)
    return `hsl(${h}, 48%, 13%)`;
  };

  const activeColor = currentTrack ? getDominantColor(currentTrack.id) : '#121212';

  const handleOpenMenu = () => {
    if (!currentTrack) return;
    setMenuTrack(currentTrack);
    setIsTrackMenuVisible(true);
  };

  const isLiked = currentTrack ? likedSongs.some((t) => t.id === currentTrack.id) : false;

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <StatusBar barStyle="light-content" />
      
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#1DB954',
          tabBarInactiveTintColor: '#B3B3B3',
          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopWidth: 0,
            paddingBottom: 6,
            paddingTop: 6,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: 'Playlists',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'musical-notes' : 'musical-notes-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Floating Mini Player */}
      {currentTrack && (
        <TouchableOpacity
          style={styles.miniPlayer}
          activeOpacity={0.9}
          onPress={() => setIsPlayerModalVisible(true)}
        >
          <View style={styles.miniPlayerContent}>
            <Image
              source={{ uri: currentTrack.image?.[1]?.url || currentTrack.image?.[0]?.url }}
              style={styles.miniAlbumArt}
            />
            <View style={styles.miniDetails}>
              <Text style={styles.miniTrackName} numberOfLines={1}>
                {currentTrack.name}
              </Text>
              <Text style={styles.miniArtistName} numberOfLines={1}>
                {currentTrack.artists?.primary?.[0]?.name || 'Unknown Artist'}
              </Text>
            </View>
            <View style={styles.miniControls}>
              <TouchableOpacity onPress={() => toggleLikeTrack(currentTrack)} style={styles.miniControlBtn}>
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isLiked ? '#FF2D55' : '#FFFFFF'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={togglePlay} style={styles.miniControlBtn}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={skipToNext} style={styles.miniControlBtn}>
                <Ionicons name="play-skip-forward" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.miniProgressBarContainer}>
            <View style={[styles.miniProgressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </TouchableOpacity>
      )}

      {/* Full-Screen Detailed Player Modal */}
      {currentTrack && (
        <Modal
          visible={isPlayerModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsPlayerModalVisible(false)}
        >
          {/* Dynamic Gradient Color matching Album Art */}
          <LinearGradient
            colors={[activeColor, '#121212', '#121212']}
            style={styles.modalContainer}
          >
            <SafeAreaView style={{ flex: 1, justifyContent: 'space-between', paddingBottom: 24 }}>
              
              {/* Top Navigation */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setIsPlayerModalVisible(false)} style={styles.headerBtn}>
                  <Ionicons name="chevron-down" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.nowPlayingTitle}>NOW PLAYING</Text>
                <TouchableOpacity onPress={handleOpenMenu} style={styles.headerBtn}>
                  <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Album Artwork */}
              <View style={styles.artworkContainer}>
                <Image
                  source={{ uri: currentTrack.image?.[2]?.url || currentTrack.image?.[1]?.url || currentTrack.image?.[0]?.url }}
                  style={styles.fullAlbumArt}
                />
              </View>

              {/* Song Details & Actions */}
              <View style={styles.metadataContainer}>
                <View style={styles.songMetadata}>
                  <Text style={styles.fullTrackName} numberOfLines={1}>
                    {currentTrack.name}
                  </Text>
                  <Text style={styles.fullArtistName} numberOfLines={1}>
                    {currentTrack.artists?.primary?.[0]?.name || 'Unknown Artist'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => currentTrack && toggleLikeTrack(currentTrack)}>
                  <Ionicons
                    name={currentTrack && likedSongs.some((t) => t.id === currentTrack.id) ? "heart" : "heart-outline"}
                    size={26}
                    color={currentTrack && likedSongs.some((t) => t.id === currentTrack.id) ? "#FF2D55" : "#FFFFFF"}
                  />
                </TouchableOpacity>
              </View>

              {/* Interactive Progress Bar */}
              <View style={styles.progressSection}>
                <View
                  style={styles.progressBarBg}
                  onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                  onTouchStart={handleSliderTouch}
                >
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  <View style={[styles.progressKnob, { left: `${progressPercent}%` }]} />
                </View>
                <View style={styles.timeLabels}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              </View>

              {/* Spotify Player Control Row */}
              <View style={styles.controlsRow}>
                <TouchableOpacity onPress={toggleShuffle}>
                  <Ionicons
                    name="shuffle"
                    size={26}
                    color={isShuffle ? '#1DB954' : '#B3B3B3'}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={skipToPrevious}>
                  <Ionicons name="play-back" size={38} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity onPress={togglePlay} style={styles.playPauseCircle}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={32}
                    color="#000000"
                    style={{ marginLeft: isPlaying ? 0 : 3 }}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={skipToNext}>
                  <Ionicons name="play-forward" size={38} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleRepeat}>
                  <Ionicons
                    name="repeat"
                    size={26}
                    color={isRepeat ? '#1DB954' : '#B3B3B3'}
                  />
                </TouchableOpacity>
              </View>

              {/* Bottom Accessories bar */}
              <View style={styles.accessoriesRow}>
                <Ionicons name="phone-portrait-outline" size={20} color="#B3B3B3" />
                <Ionicons name="share-social-outline" size={20} color="#B3B3B3" />
                <Ionicons name="list-outline" size={22} color="#B3B3B3" />
              </View>

            </SafeAreaView>
          </LinearGradient>
        </Modal>
      )}

      {/* Global Track Options Modal Triggered from Player */}
      <TrackMenuModal
        visible={isTrackMenuVisible}
        track={menuTrack}
        onClose={() => setIsTrackMenuVisible(false)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  // Mini Player
  miniPlayer: {
    position: 'absolute',
    bottom: 66,
    left: 8,
    right: 8,
    height: 60,
    backgroundColor: '#282828',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  miniPlayerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  miniAlbumArt: {
    width: 42,
    height: 42,
    borderRadius: 4,
    backgroundColor: '#121212',
  },
  miniDetails: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  miniTrackName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  miniArtistName: {
    color: '#B3B3B3',
    fontSize: 11,
  },
  miniControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 4,
  },
  miniControlBtn: {
    padding: 4,
  },
  miniProgressBarContainer: {
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  miniProgressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },

  // Full Screen Modal Player
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
  },
  headerBtn: {
    padding: 6,
  },
  nowPlayingTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  artworkContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  fullAlbumArt: {
    width: width - 64,
    height: width - 64,
    borderRadius: 8,
    backgroundColor: '#282828',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  songMetadata: {
    flex: 1,
    marginRight: 16,
  },
  fullTrackName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fullArtistName: {
    color: '#B3B3B3',
    fontSize: 15,
  },
  progressSection: {
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressKnob: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: -6 }],
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: '#B3B3B3',
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  playPauseCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  accessoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
});
