'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { getPlaylists } from '@/lib/api';
import { Home, Search, ListMusic, User, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/playlists', label: 'Playlists', icon: ListMusic },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      getPlaylists(user.id).then(setPlaylists).catch(console.error);
    }
  }, [user]);

  const handleLogOut = async () => {
    if (!confirm('Are you sure you want to sign out from Raga?')) return;
    await signOut({ redirectUrl: '/sign-in' });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[240px] bg-black z-40 pt-6 pb-24">
        {/* Logo */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <img src="/icon.png" alt="Raga Logo" className="w-8 h-8 object-contain" />
          <span className="text-white font-black text-2xl tracking-wide font-logo">Raga</span>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-4 px-3 py-3 rounded-md text-sm font-bold transition-colors',
                  active
                    ? 'text-white bg-white/10'
                    : 'text-[#B3B3B3] hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={22} className={active ? 'text-white' : ''} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="px-6 my-4">
          <div className="h-px bg-white/10 w-full" />
        </div>

        {/* User Playlists Library */}
        <div className="flex-1 px-3 flex flex-col min-h-0 overflow-hidden">
          <span className="px-3 mb-2 text-xs font-bold uppercase tracking-widest text-[#535353]">
            Playlists
          </span>
          <div className="flex-1 overflow-y-auto space-y-1">
            {playlists.map((pl) => (
              <Link
                key={pl.id}
                href="/playlists"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 transition-colors text-sm text-[#B3B3B3] hover:text-white"
              >
                <Music2 size={16} className="text-[#B3B3B3] flex-shrink-0" />
                <span className="truncate">{pl.name}</span>
              </Link>
            ))}
            {playlists.length === 0 && (
              <span className="px-3 text-xs text-[#535353] italic">
                No playlists yet
              </span>
            )}
          </div>
        </div>

        {/* User Account / Sign Out Section */}
        {user && (
          <div className="relative px-3 mt-auto pt-4 border-t border-white/5">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#282828] flex-shrink-0 flex items-center justify-center border border-white/10">
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt={user.firstName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-xs">
                    {user.firstName?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{user.firstName || 'Listener'}</p>
                <p className="text-[#B3B3B3] text-xs truncate">View Account</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#282828] border border-white/10 rounded-md shadow-xl overflow-hidden z-50 py-1">
                <Link
                  href="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 transition-colors"
                >
                  Account Profile
                </Link>
                <button
                  onClick={handleLogOut}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors border-t border-white/5"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tagline at bottom */}
        <div className="px-6 pt-3">
          <p className="text-[#535353] text-xs">Soundscape, unlocked.</p>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#121212] border-t border-white/5 flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors',
                active ? 'text-white' : 'text-[#B3B3B3]'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
