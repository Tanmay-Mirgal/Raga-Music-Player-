import { useEffect } from 'react';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { Slot } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { loadTrackPlayer } from '../utils/trackPlayer';

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log('No values stored under key: ' + key);
      }
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  );
}

export default function RootLayout() {
  useEffect(() => {
    let cancelled = false;

    const registerPlaybackService = async () => {
      const tp = await loadTrackPlayer();
      if (cancelled || !tp) {
        return;
      }

      const serviceModule = await import('../services/PlaybackService').catch((error) => {
        console.warn('[TrackPlayer] Playback service unavailable:', error);
        return null;
      });

      if (!cancelled && serviceModule?.PlaybackService) {
        tp.registerPlaybackService(() => serviceModule.PlaybackService);
      }
    };

    void registerPlaybackService();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <Slot />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
