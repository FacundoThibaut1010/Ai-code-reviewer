'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, Zap, History, Loader2, Search } from 'lucide-react';
import { useAlert } from '@/components/AlertProvider';
import RobotLogo from '@/components/RobotLogo';
import LoadingScreen from '@/components/LoadingScreen';

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only show full loading progress screen if it's the very first visit in this browser session
    const hasLoadedBefore = sessionStorage.getItem('initial_loaded');
    if (hasLoadedBefore !== 'true') {
      setShowProgress(true);
      sessionStorage.setItem('initial_loaded', 'true');
    }

    async function checkUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error checking authentication session:', err);
        setIsAuthenticated(false);
      } finally {
        setSessionChecked(true);
      }
    }
    checkUser();
  }, []);

  const handleLoadingComplete = useCallback(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      setCheckingSession(false);
      // Show logout alert if just logged out
      const showLogoutToast = sessionStorage.getItem('show_logout_toast');
      if (showLogoutToast === 'true') {
        sessionStorage.removeItem('show_logout_toast');
        showAlert({
          type: 'success',
          title: 'Sesión Cerrada',
          message: 'Cerraste tu sesión correctamente. ¡Hasta la próxima!',
        });
      }
    }
  }, [isAuthenticated, router, showAlert]);

  // If sessionChecked is true and we don't show progress, complete immediately in background
  useEffect(() => {
    if (sessionChecked && !showProgress) {
      handleLoadingComplete();
    }
  }, [sessionChecked, showProgress, handleLoadingComplete]);

  const handleGitHubLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'repo read:org',
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      console.error('Error initiating OAuth login:', err);
      const errMessage = err instanceof Error ? err.message : 'No se pudo iniciar la conexión con GitHub. Intentá nuevamente.';
      showAlert({
        type: 'error',
        title: 'Error de Conexión',
        message: errMessage,
      });
      setLoading(false);
    }
  };

  if (checkingSession && showProgress) {
    return (
      <LoadingScreen
        isDataReady={sessionChecked}
        onComplete={handleLoadingComplete}
        subtitle="Verificando sesión activa..."
      />
    );
  }

  if (checkingSession) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-950 min-h-screen w-full">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Title / Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-2">
            <RobotLogo size={96} />
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
            AI Code Reviewer
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-sm">
            Audita tus pull requests y analiza tus proyectos de GitHub en segundos con Gemini.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-6 space-y-4 shadow-xl">
          <div className="flex items-start space-x-3.5">
            <div className="mt-0.5 rounded-lg bg-indigo-500/15 p-1.5 text-indigo-400 border border-indigo-500/20">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Revisión en Streaming</h3>
              <p className="text-xs text-slate-400 mt-0.5">Observá la auditoría de código generada palabra por palabra en tiempo real.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="mt-0.5 rounded-lg bg-emerald-500/15 p-1.5 text-emerald-400 border border-emerald-500/20">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Seguridad & Rendimiento</h3>
              <p className="text-xs text-slate-400 mt-0.5">Detectá fugas de credenciales, ineficiencias de memoria y vulnerabilidades críticas.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="mt-0.5 rounded-lg bg-amber-500/15 p-1.5 text-amber-400 border border-amber-500/20">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Historial Guardado</h3>
              <p className="text-xs text-slate-400 mt-0.5">Guardá todos tus reportes técnicos en Supabase para futuras consultas.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="mt-0.5 rounded-lg bg-indigo-500/15 p-1.5 text-indigo-400 border border-indigo-500/20">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Análisis de Proyecto Completo</h3>
              <p className="text-xs text-slate-400 mt-0.5">Generá una descripción profesional de tu repositorio para portfolio, CV o LinkedIn.</p>
            </div>
          </div>
        </div>

        {/* Action area */}
        <div className="space-y-4">
          <button
            onClick={handleGitHubLogin}
            disabled={loading}
            className="flex w-full items-center justify-center space-x-3 rounded-xl bg-white px-4 py-3.5 text-sm font-bold text-slate-950 transition-all hover:bg-slate-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <GithubIcon className="h-5 w-5" />
                <span>Conectar con GitHub</span>
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-slate-500">
            Al conectarte, nos autorizás a consultar tus repositorios y diffs de Pull Requests.
          </p>
        </div>
      </div>
    </div>
  );
}
