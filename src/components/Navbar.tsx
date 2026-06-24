'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { LogOut, History, LayoutDashboard, Terminal } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getInitialUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setLoading(false);
      }
    }

    getInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('github_provider_token');
    router.push('/');
  };

  // Do not show the navbar on the login screen
  if (pathname === '/' || pathname === '/auth/callback') {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-transform group-hover:scale-105">
                <Terminal className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                AI Code Reviewer
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/dashboard"
              className={`flex items-center space-x-2 rounded-md px-3 h-9 text-sm font-medium transition-all ${
                pathname.startsWith('/repos') || pathname === '/dashboard'
                  ? 'bg-slate-800/80 text-white border border-slate-700/50'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/history"
              className={`flex items-center space-x-2 rounded-md px-3 h-9 text-sm font-medium transition-all ${
                pathname === '/history'
                  ? 'bg-slate-800/80 text-white border border-slate-700/50'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Historial</span>
            </Link>
          </div>

          {/* User Info / Sign Out */}
          <div className="flex items-center space-x-4">
            {!loading && user && (
              <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.full_name || 'GitHub avatar'}
                  className="h-8 w-8 rounded-full border border-indigo-500/30"
                />
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight">
                    {user.user_metadata.full_name || user.user_metadata.user_name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    @{user.user_metadata.user_name}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
