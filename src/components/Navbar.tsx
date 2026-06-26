'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { LogOut, History, LayoutDashboard, Menu, X } from 'lucide-react';
import RobotLogo from '@/components/RobotLogo';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

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
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('github_provider_token');
      sessionStorage.setItem('show_logout_toast', 'true');
      router.push('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Do not show the navbar on the login screen
  if (pathname === '/' || pathname === '/auth/callback') {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center">
            {/* Hamburger Button for mobile */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex md:hidden items-center justify-center p-2 mr-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-900/60 transition-colors"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/dashboard" className="flex items-center space-x-1.5 group">
              <RobotLogo size={42} />
              <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent whitespace-nowrap">
                AI Code Reviewer
              </span>
            </Link>
          </div>

          {/* Navigation Links (Desktop) */}
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

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 top-[65px] z-50 md:hidden bg-slate-950/98 backdrop-blur-xl px-6 py-8 flex flex-col justify-between shadow-2xl animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Navegación</p>
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-4 rounded-2xl px-5 py-4 text-base font-bold transition-all active:scale-[0.98] ${
                pathname.startsWith('/repos') || pathname === '/dashboard'
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/history"
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-4 rounded-2xl px-5 py-4 text-base font-bold transition-all active:scale-[0.98] ${
                pathname === '/history'
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'
              }`}
            >
              <History className="h-5 w-5" />
              <span>Historial</span>
            </Link>
          </div>

          {/* User profile & logout at the bottom of full-screen mobile menu */}
          {!loading && user && (
            <div className="border-t border-slate-900 pt-6 flex flex-col gap-4">
              <div className="flex items-center space-x-4 px-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.full_name || 'GitHub avatar'}
                  className="h-12 w-12 rounded-full border-2 border-indigo-500/40 shadow-md"
                />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-white leading-tight">
                    {user.user_metadata.full_name || user.user_metadata.user_name}
                  </span>
                  <span className="text-xs text-slate-400">
                    @{user.user_metadata.user_name}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center justify-center space-x-2.5 rounded-2xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-rose-900/35 hover:border-rose-800/50 py-3.5 text-sm font-semibold transition-all active:scale-[0.98]"
              >
                <LogOut className="h-5 w-5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
