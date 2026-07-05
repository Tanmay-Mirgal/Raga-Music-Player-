import { AudioProvider } from '@/components/AudioProvider';
import Sidebar from '@/components/Sidebar';
import MiniPlayer from '@/components/MiniPlayer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioProvider>
      <div className="min-h-screen bg-[#121212]">
        <Sidebar />

        {/* Main content area — offset by sidebar on desktop */}
        <main className="md:ml-[240px] min-h-screen pb-24 md:pb-20">
          {children}
        </main>

        {/* Persistent bottom mini player */}
        <MiniPlayer />
      </div>
    </AudioProvider>
  );
}
