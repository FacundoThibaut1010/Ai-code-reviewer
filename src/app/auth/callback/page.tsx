'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error in callback session retrieval:', error);
          router.push('/');
          return;
        }

        if (session) {
          if (session.provider_token) {
            localStorage.setItem('github_provider_token', session.provider_token);
          }
          sessionStorage.setItem('show_login_toast', 'true');
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error('Failed to handle auth callback:', err);
        router.replace('/');
      }
    }

    handleAuthCallback();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (session.provider_token) {
          localStorage.setItem('github_provider_token', session.provider_token);
        }
        sessionStorage.setItem('show_login_toast', 'true');
        router.replace('/dashboard');
      }
    });

    // Fallback: si no se obtiene sesión en 10 segundos, redirigir al login
    const timeout = setTimeout(() => {
      router.replace('/');
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-slate-950 p-6 min-h-screen w-full text-center">
      <div className="relative flex flex-col items-center">
        <div className="absolute -inset-1 rounded-full bg-indigo-500/20 blur-xl opacity-40 animate-pulse"></div>
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
      <h2 className="mt-4 text-sm font-semibold text-slate-300">Autenticando con GitHub...</h2>
      <p className="mt-1 text-xs text-slate-500">Configurando tu entorno de revisión.</p>
    </div>
  );
}
