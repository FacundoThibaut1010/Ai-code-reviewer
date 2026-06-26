'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LoadingScreen from '@/components/LoadingScreen';

export default function AuthCallback() {
  const router = useRouter();
  const [dataReady, setDataReady] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function handleAuthCallback() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error in callback session retrieval:', error);
          if (active) {
            setNextPath('/');
            setDataReady(true);
          }
          return;
        }

        if (session) {
          if (session.provider_token) {
            localStorage.setItem('github_provider_token', session.provider_token);
          }
          sessionStorage.setItem('show_login_toast', 'true');
          if (active) {
            setNextPath('/dashboard');
            setDataReady(true);
          }
        }
      } catch (err) {
        console.error('Failed to handle auth callback:', err);
        if (active) {
          setNextPath('/');
          setDataReady(true);
        }
      }
    }

    handleAuthCallback();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (session.provider_token) {
          localStorage.setItem('github_provider_token', session.provider_token);
        }
        sessionStorage.setItem('show_login_toast', 'true');
        if (active) {
          setNextPath('/dashboard');
          setDataReady(true);
        }
      }
    });

    // Fallback: si no se obtiene sesión en 8 segundos, redirigir al login
    const timeout = setTimeout(() => {
      if (active) {
        setNextPath('/');
        setDataReady(true);
      }
    }, 8000);

    return () => {
      active = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleLoadingComplete = () => {
    router.replace(nextPath || '/');
  };

  return (
    <LoadingScreen
      isDataReady={dataReady}
      onComplete={handleLoadingComplete}
      title="Autenticando con GitHub"
      subtitle="Vinculando credenciales de desarrollador y preparando tu entorno..."
    />
  );
}
