'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Github, Terminal, Shield, Zap, History, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/dashboard');
        } else {
          setCheckingSession(false);
        }
      } catch (err) {
        console.error('Error checking authentication session:', err);
        setCheckingSession(false);
      }
    }
    checkUser();
  }, [router]);

  const handleGitHubLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'repo read:org',
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Error initiating OAuth login:', err);
      setError(err.message || 'No se pudo iniciar la conexión con GitHub. Intentá nuevamente.');
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-950 p-6">
        <div className="relative flex flex-col items-center">
          <div className="absolute -inset-1 rounded-full bg-indigo-500 blur-xl opacity-30 animate-pulse"></div>
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400">
            <Terminal className="h-8 w-8 animate-pulse" />
          </div>
          <Loader2 className="mt-6 h-6 w-6 animate-spin text-slate-500" />
          <span className="mt-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Cargando sesión...
          </span>
        </div>
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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] border border-indigo-400/20">
            <Terminal className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
            AI Code Reviewer
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-sm">
            Audita tus pull requests de GitHub automáticamente con Claude 3.5 Sonnet en segundos.
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
        </div>

        {/* Action area */}
        <div className="space-y-4">
          {error && (
            <div className="flex items-center space-x-2.5 rounded-lg border border-rose-900/50 bg-rose-950/20 p-3.5 text-xs text-rose-400">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGitHubLogin}
            disabled={loading}
            className="flex w-full items-center justify-center space-x-3 rounded-xl bg-white px-4 py-3.5 text-sm font-bold text-slate-950 transition-all hover:bg-slate-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Github className="h-5 w-5 fill-current" />
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
