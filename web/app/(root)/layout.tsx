import { AudioProvider } from '@/components/AudioProvider';
import Sidebar from '@/components/Sidebar';
import RightPanel from '@/components/RightPanel';
import MiniPlayer from '@/components/MiniPlayer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioProvider>
      <div className="min-h-screen bg-[#121212] flex">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Main Scrollable Content */}
        <main className="flex-1 md:ml-[240px] lg:mr-[300px] min-h-screen pb-36 md:pb-24 overflow-y-auto">
          {children}
        </main>

        {/* Right Now Playing / Queue Sidebar */}
        <RightPanel />

        {/* Persistent bottom mini player */}
        <MiniPlayer />
      </div>
    </AudioProvider>
  );
}
