'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchPullRequestDetails, fetchPullRequestDiff } from '@/lib/github';
import { parsePartialJson } from '@/lib/json-repair';
import { PullRequest, AIReviewContent, ReviewSettings } from '@/types';
import DiffViewer from '@/components/DiffViewer';
import ReviewRenderer from '@/components/ReviewRenderer';
import PRChat from '@/components/PRChat';
import {
  ArrowLeft,
  Settings,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Lightbulb,
  Play,
  Save,
  Loader2,
  FileCode2,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useAlert } from '@/components/AlertProvider';

export default function PRDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { showAlert } = useAlert();
 
  const owner = params.owner as string;
  const repo = params.repo as string;
  const numberStr = params.number as string;
  const number = Number(numberStr);
 
  const [pr, setPr] = useState<PullRequest | null>(null);
  const [diffText, setDiffText] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // AI Review states
  const [isStreaming, setIsStreaming] = useState(false);
  const [review, setReview] = useState<Partial<AIReviewContent>>({});
  const [isSavedInDb, setIsSavedInDb] = useState(false);
  const [saving, setSaving] = useState(false);

  // Settings
  const [settings, setSettings] = useState<ReviewSettings>({
    bugs: true,
    performance: true,
    security: true,
    style: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/');
        return;
      }

      const token = localStorage.getItem('github_provider_token');
      if (!token) {
        showAlert({
          type: 'error',
          title: 'Sesión Inválida',
          message: 'Token de GitHub no encontrado. Iniciá sesión de nuevo.',
          onConfirm: () => router.replace('/'),
        });
        return;
      }

      // Fetch metadata and diff concurrently
      const [prDetails, prDiff] = await Promise.all([
        fetchPullRequestDetails(token, owner, repo, number),
        fetchPullRequestDiff(token, owner, repo, number),
      ]);

      setPr(prDetails);
      setDiffText(prDiff);

      // Check if there is an existing review in Supabase
      const { data: existingReview, error: dbError } = await supabase
        .from('reviews')
        .select('*')
        .eq('repo_owner', owner)
        .eq('repo_name', repo)
        .eq('pr_number', number)
        .maybeSingle();

      if (dbError) {
        console.error('Error checking existing reviews in Supabase:', dbError);
      }

      if (existingReview) {
        setReview(existingReview.review_content);
        setIsSavedInDb(true);
      }
    } catch (err: unknown) {
      console.error('Error loading PR data:', err);
      showAlert({
        type: 'error',
        title: 'Error de Carga',
        message: 'Error al obtener la información de la Pull Request y su diff.',
      });
    } finally {
      setLoading(false);
    }
  }, [owner, repo, number, router, showAlert]);

  useEffect(() => {
    if (owner && repo && number) {
      loadData();
    }
  }, [owner, repo, number, loadData]);

  const handleStartAIReview = async () => {
    setIsStreaming(true);
    setReview({});
    setIsSavedInDb(false);

    showAlert({
      type: 'info',
      title: 'Análisis Iniciado',
      message: 'Gemini está auditando tu Pull Request en tiempo real.',
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Tu sesión ha expirado.');
      }

      // Get edge function URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/review-diff`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diff: diffText,
          settings,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error en el servidor de análisis: ${response.status} ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('El navegador no soporta lectura de flujos en streaming.');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let textAccumulator = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data:')) {
            try {
              const dataStr = trimmed.substring(5).trim();
              if (dataStr === '[DONE]') continue;

              const parsed = JSON.parse(dataStr);
              // In Claude messages streaming API, text updates come inside type: "content_block_delta"
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                textAccumulator += parsed.delta.text;
                // Parse the repaired partial JSON
                const parsedReview = parsePartialJson<AIReviewContent>(textAccumulator);
                setReview(parsedReview);
              }
            } catch {
              // Ignore partial parsing errors of incomplete JSON chunks
            }
          }
        }
      }

      // Parse final chunk if any remaining in buffer
      if (buffer.trim().startsWith('data:')) {
        try {
          const dataStr = buffer.trim().substring(5).trim();
          const parsed = JSON.parse(dataStr);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            textAccumulator += parsed.delta.text;
            const parsedReview = parsePartialJson<AIReviewContent>(textAccumulator);
            setReview(parsedReview);
          }
        } catch {
          // Ignore final chunk errors
        }
      }

      showAlert({
        type: 'success',
        title: 'Análisis Completado',
        message: 'La revisión de código se completó correctamente.',
      });

    } catch (err: unknown) {
      console.error('Error during AI Review streaming:', err);
      const errMsg = err instanceof Error ? err.message : 'Error durante la llamada de streaming con la IA.';
      showAlert({
        type: 'error',
        title: 'Análisis Fallido',
        message: errMsg,
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSaveReview = async () => {
    if (!pr || !review || isSavedInDb) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesión expirada.');

      const { error: dbError } = await supabase.from('reviews').insert({
        user_id: session.user.id,
        repo_name: repo,
        repo_owner: owner,
        pr_number: number,
        pr_title: pr.title,
        pr_url: pr.html_url,
        review_content: review as AIReviewContent,
        score: review.score || 5,
        created_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      setIsSavedInDb(true);
      showAlert({
        type: 'success',
        title: 'Review Guardada',
        message: 'La auditoría técnica del Pull Request se guardó correctamente en Supabase.',
      });
    } catch (err: unknown) {
      console.error('Error saving review to database:', err);
      showAlert({
        type: 'error',
        title: 'Error de Guardado',
        message: 'No se pudo guardar la review en la base de datos.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col w-full">
      {/* Back button and PR header info */}
      <div className="pb-6 border-b border-slate-900">
        <Link
          href={`/repos/${owner}/${repo}`}
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Volver a Pull Requests
        </Link>

        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-slate-800 rounded w-1/3"></div>
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
          </div>
        ) : pr ? (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-xs text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-950 bg-indigo-950/20 font-mono">
                    PR #{pr.number}
                  </span>
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold border ${
                    pr.state === 'open'
                      ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'
                      : 'bg-rose-950/20 text-rose-400 border-rose-900/30'
                  }`}>
                    {pr.state === 'open' ? 'Abierta' : 'Cerrada'}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white mt-2">
                  {pr.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Creada por <span className="font-semibold text-slate-300">@{pr.user.login}</span> •{' '}
                  {new Date(pr.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Inline errors removed, replaced by Sileo alert context */}

      {loading ? (
        <div className="flex flex-1 items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        /* Main Layout Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6 flex-1 items-start">
          
          {/* Left panel: Diff Viewer (7/12 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center space-x-2 pb-2">
              <FileCode2 className="h-5 w-5 text-indigo-400" />
              <h3 className="text-md font-bold text-slate-200">Archivos Cambiados (Diff)</h3>
            </div>
            <div className="max-h-[75vh] overflow-y-auto pr-1">
              <DiffViewer diffText={diffText} />
            </div>
          </div>

          {/* Right panel: AI review & Configurations (5/12 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Settings Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-900 pb-3">
                <Settings className="h-4.5 w-4.5 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Configuración del Análisis
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Bug check */}
                <label className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all hover:bg-slate-900/40 ${
                  settings.bugs
                    ? 'border-indigo-500/30 bg-indigo-500/5 text-slate-200'
                    : 'border-slate-800 bg-slate-950/20 text-slate-500'
                }`}>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className={`h-4 w-4 ${settings.bugs ? 'text-rose-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-semibold">Bugs</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.bugs}
                    onChange={(e) => setSettings({ ...settings, bugs: e.target.checked })}
                    disabled={isStreaming}
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:opacity-50"
                  />
                </label>

                {/* Performance check */}
                <label className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all hover:bg-slate-900/40 ${
                  settings.performance
                    ? 'border-indigo-500/30 bg-indigo-500/5 text-slate-200'
                    : 'border-slate-800 bg-slate-950/20 text-slate-500'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Zap className={`h-4 w-4 ${settings.performance ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-semibold">Rendimiento</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.performance}
                    onChange={(e) => setSettings({ ...settings, performance: e.target.checked })}
                    disabled={isStreaming}
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:opacity-50"
                  />
                </label>

                {/* Security check */}
                <label className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all hover:bg-slate-900/40 ${
                  settings.security
                    ? 'border-indigo-500/30 bg-indigo-500/5 text-slate-200'
                    : 'border-slate-800 bg-slate-950/20 text-slate-500'
                }`}>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className={`h-4 w-4 ${settings.security ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-semibold">Seguridad</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.security}
                    onChange={(e) => setSettings({ ...settings, security: e.target.checked })}
                    disabled={isStreaming}
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:opacity-50"
                  />
                </label>

                {/* Style check */}
                <label className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all hover:bg-slate-900/40 ${
                  settings.style
                    ? 'border-indigo-500/30 bg-indigo-500/5 text-slate-200'
                    : 'border-slate-800 bg-slate-950/20 text-slate-500'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Lightbulb className={`h-4 w-4 ${settings.style ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-semibold">Sugerencias</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.style}
                    onChange={(e) => setSettings({ ...settings, style: e.target.checked })}
                    disabled={isStreaming}
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:opacity-50"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleStartAIReview}
                  disabled={isStreaming || !diffText}
                  className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-md disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                >
                  {isStreaming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Analizando...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      <span>Analizar con IA</span>
                    </>
                  )}
                </button>

                {Object.keys(review).length > 0 && !isStreaming && (
                  <button
                    onClick={handleSaveReview}
                    disabled={saving || isSavedInDb}
                    className={`flex items-center justify-center space-x-2 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                      isSavedInDb
                        ? 'bg-slate-900 text-emerald-400 border border-emerald-900/30'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98]'
                    } disabled:opacity-70`}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isSavedInDb ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Guardado</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Guardar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* AI Review Output Renderer */}
            {(Object.keys(review).length > 0 || isStreaming) && (
              <ReviewRenderer review={review} isStreaming={isStreaming} />
            )}

            {Object.keys(review).length > 0 && !isStreaming && (
              <PRChat diffText={diffText} review={review as AIReviewContent} />
            )}

          </div>

        </div>
      )}
    </div>
  );
}
