type TrackPlayerNamespace = typeof import('react-native-track-player');
type TrackPlayerModule = TrackPlayerNamespace['default'] & Omit<TrackPlayerNamespace, 'default'>;

let trackPlayerPromise: Promise<TrackPlayerModule | null> | null = null;

export const loadTrackPlayer = async (): Promise<TrackPlayerModule | null> => {
  if (!trackPlayerPromise) {
    trackPlayerPromise = import('react-native-track-player').catch((error) => {
      console.warn('[TrackPlayer] Native module unavailable:', error);
      return null;
    }).then((module) => {
      if (!module) {
        return null;
      }

      return {
        ...(module.default ?? {}),
        ...module,
      } as TrackPlayerModule;
    });
  }

  return trackPlayerPromise;
};
