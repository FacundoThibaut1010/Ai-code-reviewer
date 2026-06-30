'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const pathname = usePathname();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    
    setTheme(initialTheme);
    if (initialTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }

    const handleThemeChange = () => {
      const current = (localStorage.getItem('theme') as 'dark' | 'light' | null) || 'dark';
      setTheme(current);
    };

    window.addEventListener('theme-change', handleThemeChange);
    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);

    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    
    window.dispatchEvent(new Event('theme-change'));
  };

  const isLoginPage = pathname === '/';

  return (
    <button
      onClick={toggleTheme}
      className={`h-12 w-12 rounded-full border border-slate-800/80 bg-slate-900/60 backdrop-blur-md text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 z-[80] ${
        isLoginPage
          ? 'fixed top-6 right-6 sm:top-auto sm:bottom-6 sm:left-6'
          : 'fixed bottom-6 left-6 md:hidden'
      }`}
      title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-amber-400" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700" />
      )}
    </button>
  );
}
