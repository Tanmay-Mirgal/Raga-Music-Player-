import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Raga Music Player',
    short_name: 'Raga',
    description: 'Raga is your personalized AI-powered music player. Discover, stream, and vibe to music tailored to your taste.',
    start_url: '/',
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#1DB954',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
