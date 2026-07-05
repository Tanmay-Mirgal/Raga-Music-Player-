import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://raga.tanmaymirgal.dev'),
  title: 'Raga — Soundscape, Unlocked',
  description: 'Raga is your personalized AI-powered music player. Discover, stream, and vibe to music tailored to your taste.',
  keywords: ['raga', 'music player', 'ai music', 'music streaming', 'jiosaavn', 'lyrics sync'],
  authors: [{ name: 'Tanmay Mirgal' }],
  openGraph: {
    title: 'Raga — Soundscape, Unlocked',
    description: 'Raga is your personalized AI-powered music player. Discover, stream, and vibe to music tailored to your taste.',
    url: 'https://raga.tanmaymirgal.dev',
    siteName: 'Raga Music Player',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'Raga Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Raga — Soundscape, Unlocked',
    description: 'Raga is your personalized AI-powered music player. Discover, stream, and vibe to music tailored to your taste.',
    images: ['/icon.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-[#121212] text-white antialiased`}>
          {children}
          <Toaster position="top-center" theme="dark" />
        </body>
      </html>
    </ClerkProvider>
  );
}
