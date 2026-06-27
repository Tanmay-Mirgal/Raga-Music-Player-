import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, SafeAreaView, Dimensions, StatusBar, Animated, ActivityIndicator, FlatList, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
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
    sleepTimerTimeLeft,
    setSleepTimer,
    queue,
    currentIndex,
    removeFromQueue,
    moveQueueItem,
  } = useAudio();

  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(width - 64);

  // States for the bottom-sheet Options Menu
  const [isTrackMenuVisible, setIsTrackMenuVisible] = useState(false);
  const [menuTrack, setMenuTrack] = useState<any>(null);

  // States for Sleep Timer, Queue, and Lyrics Modals
  const [isSleepTimerModalVisible, setIsSleepTimerModalVisible] = useState(false);
  const [isQueueModalVisible, setIsQueueModalVisible] = useState(false);
  const [isLyricsModalVisible, setIsLyricsModalVisible] = useState(false);

  // Lyrics states
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsLines, setLyricsLines] = useState<{ time: number; text: string }[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const lyricsListRef = useRef<FlatList>(null);

  // Dynamic HSL Cross-fade state
  const [currentColor, setCurrentColor] = useState('#121212');
  const [prevColor, setPrevColor] = useState('#121212');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // HSL Dynamic color generator
  const getDominantColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 48%, 13%)`;
  };

  useEffect(() => {
    if (currentTrack) {
      const nextColor = getDominantColor(currentTrack.id);
      setPrevColor(currentColor);
      setCurrentColor(nextColor);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }
  }, [currentTrack?.id]);

  // Sync Lyrics fetcher
  useEffect(() => {
    if (!currentTrack || !isLyricsModalVisible) return;

    const fetchLyrics = async () => {
      setLyricsLoading(true);
      setLyricsLines([]);
      setPlainLyrics(null);
      try {
        const trackName = currentTrack.name;
        const artistName = currentTrack.artists?.primary?.[0]?.name || 'Unknown Artist';
        const query = `${trackName} ${artistName}`;
        const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const match = data[0];
            if (match.syncedLyrics) {
              const lines = parseLRC(match.syncedLyrics);
              setLyricsLines(lines);
            } else if (match.plainLyrics) {
              setPlainLyrics(match.plainLyrics);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching lyrics:', err);
      } finally {
        setLyricsLoading(false);
      }
    };

    fetchLyrics();
  }, [currentTrack?.id, isLyricsModalVisible]);

  // LRC Timestamps Parser
  const parseLRC = (lrcText: string) => {
    const lines = lrcText.split('\n');
    const result: { time: number; text: string }[] = [];
    const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
      const match = timeReg.exec(line);
      if (match) {
        const min = parseInt(match[1]);
        const sec = parseInt(match[2]);
        const msStr = match[3];
        const ms = parseInt(msStr) * (msStr.length === 2 ? 10 : 1);
        const time = min * 60000 + sec * 1000 + ms;
        const text = line.replace(timeReg, '').trim();
        result.push({ time, text });
      }
    }
    return result.sort((a, b) => a.time - b.time);
  };

  const currentLyricIndex = lyricsLines.findIndex((line, index) => {
    const nextLine = lyricsLines[index + 1];
    return position >= line.time && (!nextLine || position < nextLine.time);
  });

  // Autoscroll lyrics to center
  useEffect(() => {
    if (lyricsListRef.current && currentLyricIndex !== -1 && isLyricsModalVisible) {
      try {
        lyricsListRef.current.scrollToIndex({
          index: currentLyricIndex,
          animated: true,
          viewPosition: 0.3,
        });
      } catch (e) {}
    }
  }, [currentLyricIndex, isLyricsModalVisible]);

  // Helpers
  const formatTime = (millis: number) => {
    if (isNaN(millis) || millis < 0) return '0:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const handleSliderTouch = (event: any) => {
    if (duration <= 0) return;
    const touchX = event.nativeEvent.locationX;
    const percent = Math.max(0, Math.min(1, touchX / sliderWidth));
    seekTo(percent * duration);
  };

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
          <View style={{ flex: 1, backgroundColor: '#121212' }}>
            {/* Base Layer (Prev Color) */}
            <LinearGradient
              colors={[prevColor, '#121212', '#121212']}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Top Layer (Current Color fading in) */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
              <LinearGradient
                colors={[currentColor, '#121212', '#121212']}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>

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
                <TouchableOpacity onPress={() => setIsSleepTimerModalVisible(true)} style={styles.accessoryBtn}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="timer-outline" size={20} color={sleepTimerTimeLeft !== null ? '#1DB954' : '#B3B3B3'} />
                    {sleepTimerTimeLeft !== null && (
                      <Text style={{ color: '#1DB954', fontSize: 11, fontWeight: 'bold' }}>
                        {formatCountdown(sleepTimerTimeLeft)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsLyricsModalVisible(true)} style={styles.accessoryBtn}>
                  <Ionicons name="chatbox-ellipses-outline" size={20} color="#B3B3B3" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsQueueModalVisible(true)} style={styles.accessoryBtn}>
                  <Ionicons name="list-outline" size={22} color="#B3B3B3" />
                </TouchableOpacity>
              </View>

            </SafeAreaView>
          </View>
        </Modal>
      )}

      {/* Sleep Timer Picker Modal */}
      <Modal
        visible={isSleepTimerModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSleepTimerModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsSleepTimerModalVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.modalHeaderTitle}>Set Sleep Timer</Text>
            {[
              { label: '5 minutes', value: 5 },
              { label: '15 minutes', value: 15 },
              { label: '30 minutes', value: 30 },
              { label: '45 minutes', value: 45 },
              { label: '60 minutes', value: 60 },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.pickerOption}
                onPress={() => {
                  setSleepTimer(opt.value);
                  setIsSleepTimerModalVisible(false);
                  Alert.alert('Timer Set', `Audio playback will stop in ${opt.label}.`);
                }}
              >
                <Text style={styles.pickerOptionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            {sleepTimerTimeLeft !== null && (
              <TouchableOpacity
                style={[styles.pickerOption, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => {
                  setSleepTimer(null);
                  setIsSleepTimerModalVisible(false);
                  Alert.alert('Timer Cancelled', 'Sleep timer turned off.');
                }}
              >
                <Text style={[styles.pickerOptionText, { color: '#FF5252' }]}>Turn Off Timer</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.pickerCloseBtn}
              onPress={() => setIsSleepTimerModalVisible(false)}
            >
              <Text style={styles.pickerCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Active Queue Modal */}
      <Modal
        visible={isQueueModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsQueueModalVisible(false)}
      >
        <SafeAreaView style={styles.queueModalContainer}>
          <View style={styles.queueHeader}>
            <TouchableOpacity onPress={() => setIsQueueModalVisible(false)} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.queueTitle}>Play Queue</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Now Playing Section */}
          <View style={styles.nowPlayingSection}>
            <Text style={styles.queueSectionHeader}>Now Playing</Text>
            {currentTrack && (
              <View style={styles.queueTrackRowActive}>
                <Image
                  source={{ uri: currentTrack.image?.[1]?.url || currentTrack.image?.[0]?.url }}
                  style={styles.queueTrackThumb}
                />
                <View style={styles.queueTrackDetails}>
                  <Text style={styles.queueTrackNameActive} numberOfLines={1}>
                    {currentTrack.name}
                  </Text>
                  <Text style={styles.queueTrackArtist} numberOfLines={1}>
                    {currentTrack.artists?.primary?.[0]?.name || 'Unknown Artist'}
                  </Text>
                </View>
                <Ionicons name="volume-high" size={20} color="#1DB954" style={{ marginRight: 12 }} />
              </View>
            )}
          </View>

          {/* Upcoming Queue Section */}
          <Text style={[styles.queueSectionHeader, { paddingHorizontal: 16, marginTop: 12 }]}>Next In Queue</Text>
          <FlatList
            data={queue}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            renderItem={({ item, index }) => {
              if (index <= currentIndex) return null;
              return (
                <View style={styles.queueTrackRow}>
                  <Image
                    source={{ uri: item.image?.[1]?.url || item.image?.[0]?.url }}
                    style={styles.queueTrackThumb}
                  />
                  <View style={styles.queueTrackDetails}>
                    <Text style={styles.queueTrackName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.queueTrackArtist} numberOfLines={1}>
                      {item.artists?.primary?.[0]?.name || 'Unknown Artist'}
                    </Text>
                  </View>

                  {/* Reorder Up */}
                  {index > currentIndex + 1 && (
                    <TouchableOpacity onPress={() => moveQueueItem(index, 'up')} style={styles.queueActionBtn}>
                      <Ionicons name="chevron-up-outline" size={20} color="#B3B3B3" />
                    </TouchableOpacity>
                  )}

                  {/* Reorder Down */}
                  {index < queue.length - 1 && (
                    <TouchableOpacity onPress={() => moveQueueItem(index, 'down')} style={styles.queueActionBtn}>
                      <Ionicons name="chevron-down-outline" size={20} color="#B3B3B3" />
                    </TouchableOpacity>
                  )}

                  {/* Remove track */}
                  <TouchableOpacity onPress={() => removeFromQueue(item.id)} style={styles.queueActionBtn}>
                    <Ionicons name="trash-outline" size={18} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyQueueContainer}>
                <Ionicons name="list-outline" size={48} color="#535353" />
                <Text style={styles.emptyQueueText}>Queue is empty. Add songs to play next!</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Lyrics Modal */}
      <Modal
        visible={isLyricsModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsLyricsModalVisible(false)}
      >
        <SafeAreaView style={styles.lyricsModalContainer}>
          <View style={styles.lyricsHeader}>
            <TouchableOpacity onPress={() => setIsLyricsModalVisible(false)} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.lyricsTitle}>Lyrics</Text>
            <View style={{ width: 40 }} />
          </View>

          {lyricsLoading ? (
            <View style={styles.lyricsLoader}>
              <ActivityIndicator size="large" color="#1DB954" />
              <Text style={styles.lyricsLoaderText}>Fetching lyrics from LRCLIB...</Text>
            </View>
          ) : lyricsLines.length > 0 ? (
            <FlatList
              ref={lyricsListRef}
              data={lyricsLines}
              keyExtractor={(item, index) => `${item.time}-${index}`}
              contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 120 }}
              showsVerticalScrollIndicator={false}
              getItemLayout={(data, index) => ({
                length: 50,
                offset: 50 * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {}}
              renderItem={({ item, index }) => {
                const isActive = index === currentLyricIndex;
                return (
                  <Text
                    style={[
                      styles.lyricLine,
                      isActive && styles.lyricLineActive,
                      !isActive && index < currentLyricIndex && styles.lyricLinePassed
                    ]}
                  >
                    {item.text}
                  </Text>
                );
              }}
            />
          ) : plainLyrics ? (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}>
              <Text style={styles.plainLyricsText}>{plainLyrics}</Text>
            </ScrollView>
          ) : (
            <View style={styles.emptyLyricsContainer}>
              <Ionicons name="sad-outline" size={48} color="#535353" />
              <Text style={styles.emptyLyricsText}>No lyrics found for this song.</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

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
  accessoryBtn: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal Backdrop/Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerModalContent: {
    backgroundColor: '#282828',
    borderRadius: 14,
    width: '100%',
    maxWidth: 320,
    padding: 16,
    alignItems: 'stretch',
  },
  modalHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerOption: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  pickerOptionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  pickerCloseBtn: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  pickerCloseText: {
    color: '#B3B3B3',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Queue Modal Styles
  queueModalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 56,
  },
  queueTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  queueSectionHeader: {
    color: '#B3B3B3',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  nowPlayingSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  queueTrackRowActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(29, 185, 84, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  queueTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  queueTrackThumb: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#282828',
  },
  queueTrackDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  queueTrackNameActive: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: 'bold',
  },
  queueTrackName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  queueTrackArtist: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 2,
  },
  queueActionBtn: {
    padding: 10,
  },
  emptyQueueContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyQueueText: {
    color: '#B3B3B3',
    fontSize: 14,
    textAlign: 'center',
  },

  // Lyrics Modal Styles
  lyricsModalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  lyricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 56,
  },
  lyricsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lyricsLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  lyricsLoaderText: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  plainLyricsText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '500',
  },
  lyricLine: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 28,
    paddingVertical: 10,
    textAlign: 'center',
  },
  lyricLineActive: {
    color: '#1DB954',
    fontSize: 24,
    lineHeight: 34,
  },
  lyricLinePassed: {
    color: 'rgba(255,255,255,0.2)',
  },
  emptyLyricsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyLyricsText: {
    color: '#B3B3B3',
    fontSize: 14,
  },
});
