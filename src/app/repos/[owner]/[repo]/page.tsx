'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  fetchRepoPullRequests,
  fetchRepoDetails,
  fetchRepoLanguages,
  fetchRepoCommits,
  fetchRepoTree,
  fetchFileContent,
} from '@/lib/github';
import { PullRequest } from '@/types';
import {
  ArrowLeft,
  GitPullRequest,
  Search,
  Award,
  Calendar,
  User,
  RefreshCw,
  Eye,
  HelpCircle,
  FileCode2,
  Check,
  Copy,
  Sparkles,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useAlert } from '@/components/AlertProvider';

export default function RepoPullRequestsPage() {
  const router = useRouter();
  const params = useParams();
  const { showAlert } = useAlert();
  
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'open' | 'closed' | 'all'>('all');

  // Project analysis state
  const [activeTab, setActiveTab] = useState<'prs' | 'project'>('prs');
  const [projectAnalysis, setProjectAnalysis] = useState<string>('');
  const [analyzingProject, setAnalyzingProject] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<'linkedin' | 'cv' | 'portfolio' | null>(null);

  const startProjectAnalysis = async () => {
    setAnalyzingProject(true);
    setAnalysisError(null);
    setProjectAnalysis('');
    
    try {
      const token = localStorage.getItem('github_provider_token');
      if (!token) throw new Error('Token de GitHub no encontrado. Inicie sesión de nuevo.');

      // 1. Obtener detalles del repositorio
      const repoDetails = await fetchRepoDetails(token, owner, repo);
      const defaultBranch = repoDetails.default_branch || 'master';

      // 2. Obtener lenguajes
      const languagesData = await fetchRepoLanguages(token, owner, repo);

      // 3. Obtener commits recientes
      const commitsData = await fetchRepoCommits(token, owner, repo);

      // 4. Obtener árbol de archivos
      const treeData = await fetchRepoTree(token, owner, repo, defaultBranch);
      const filesList: string[] = (treeData.tree || [])
        .filter((item) => item.type === 'blob')
        .map((item) => item.path);

      // 5. Descargar contenido de archivos clave
      const contentsMap: Record<string, string> = {};
      
      const readmePath = filesList.find(f => f.toLowerCase() === 'readme.md');
      const packageJsonPath = filesList.find(f => f === 'package.json');
      const nextConfigPath = filesList.find(f => f.startsWith('next.config'));
      const tsConfigPath = filesList.find(f => f === 'tsconfig.json');
      
      // Filtro inteligente de archivos de código fuente principales
      const excludedDirs = ['node_modules/', '.git/', '.next/', 'dist/', 'build/', 'vendor/'];
      const mainCodeFiles = filesList.filter(f => {
        // Excluir directorios pesados/autogenerados
        const isExcluded = excludedDirs.some(dir => f.includes(dir));
        if (isExcluded) return false;

        // Comprobar extensiones de código más comunes
        const hasCodeExt = f.endsWith('.tsx') || 
                           f.endsWith('.ts') || 
                           f.endsWith('.js') || 
                           f.endsWith('.jsx') ||
                           f.endsWith('.php') || 
                           f.endsWith('.py') || 
                           f.endsWith('.go') || 
                           f.endsWith('.java') || 
                           f.endsWith('.rb') || 
                           f.endsWith('.html') || 
                           f.endsWith('.css');
        
        return hasCodeExt;
      }).slice(0, 5); // Tomamos hasta 5 archivos principales

      const pathsToFetch = [
        readmePath,
        packageJsonPath,
        nextConfigPath,
        tsConfigPath,
        ...mainCodeFiles
      ].filter((p): p is string => !!p);

      await Promise.all(
        pathsToFetch.map(async (path) => {
          try {
            const content = await fetchFileContent(token, owner, repo, path);
            if (content) {
              contentsMap[path] = content;
            }
          } catch (e) {
            console.warn(`Error fetching file content for ${path}:`, e);
          }
        })
      );

      // 6. Iniciar llamada a la Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión de usuario activa.');

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://otxrnggimdwsbuozyxvf.supabase.co'}/functions/v1/analyze-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          repoName: `${owner}/${repo}`,
          description: repoDetails.description || '',
          languages: languagesData,
          commits: commitsData,
          files: filesList,
          fileContents: contentsMap,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Error al conectar con la IA de Grok.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      if (!reader) {
        throw new Error('No se pudo establecer el canal de streaming.');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Mantener la última línea incompleta en el búfer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.substring(5).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'content_block_delta') {
                const text = parsed.delta?.text || '';
                setProjectAnalysis((prev) => prev + text);
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }

      // Procesar remanente del búfer al finalizar
      if (buffer.trim().startsWith('data:')) {
        try {
          const dataStr = buffer.trim().substring(5).trim();
          const parsed = JSON.parse(dataStr);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            const text = parsed.delta.text;
            setProjectAnalysis((prev) => prev + text);
          }
        } catch {
          // Ignore
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Ocurrió un error inesperado al analizar el proyecto.';
      console.error('Error analyzing project:', err);
      setAnalysisError(errMsg);
      showAlert({
        type: 'error',
        title: 'Error de Análisis',
        message: errMsg,
      });
    } finally {
      setAnalyzingProject(false);
    }
  };

  const parseAnalysisSections = (text: string) => {
    const linkedinIndex = text.indexOf('### LINKEDIN');
    const cvIndex = text.indexOf('### CV');
    const portfolioIndex = text.indexOf('### PORTFOLIO');

    let linkedin = '';
    let cv = '';
    let portfolio = '';

    if (linkedinIndex !== -1) {
      const start = linkedinIndex + '### LINKEDIN'.length;
      const end = cvIndex !== -1 ? cvIndex : (portfolioIndex !== -1 ? portfolioIndex : text.length);
      linkedin = text.substring(start, end).trim();
    }

    if (cvIndex !== -1) {
      const start = cvIndex + '### CV'.length;
      const end = portfolioIndex !== -1 ? portfolioIndex : text.length;
      cv = text.substring(start, end).trim();
    }

    if (portfolioIndex !== -1) {
      const start = portfolioIndex + '### PORTFOLIO'.length;
      const end = text.length;
      portfolio = text.substring(start, end).trim();
    }

    // Fallbacks
    if (!linkedin && !cv && !portfolio) {
      portfolio = text;
    }

    return { linkedin, cv, portfolio };
  };

  const copyToClipboard = (text: string, section: 'linkedin' | 'cv' | 'portfolio') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    
    showAlert({
      type: 'success',
      title: 'Copiado al Portapapeles',
      message: `El texto generado para ${section === 'linkedin' ? 'LinkedIn' : section === 'cv' ? 'CV' : 'Portfolio'} fue copiado con éxito.`,
    });

    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

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
          message: 'Token de GitHub no encontrado. Por favor, iniciá sesión de nuevo.',
          onConfirm: () => router.replace('/'),
        });
        return;
      }

      // Fetch from GitHub REST API
      const fetchedPRs = await fetchRepoPullRequests(token, owner, repo, 'all');

      // Fetch saved reviews from Supabase to check which PRs already have reviews
      const { data: dbReviews, error: dbError } = await supabase
        .from('reviews')
        .select('pr_number, score')
        .eq('repo_owner', owner)
        .eq('repo_name', repo);

      if (dbError) {
        console.error('Error fetching Supabase reviews:', dbError);
      }

      // Merge GitHub PRs with DB reviews status
      const mergedPRs = fetchedPRs.map((pr) => {
        const matchingReview = dbReviews?.find((r) => r.pr_number === pr.number);
        return {
          ...pr,
          hasReview: !!matchingReview,
          reviewScore: matchingReview?.score,
        };
      });

      setPrs(mergedPRs);
    } catch (err: unknown) {
      console.error('Error loading PRs:', err);
      showAlert({
        type: 'error',
        title: 'Error de Conexión',
        message: 'No se pudieron cargar las Pull Requests. Verificá tu token y la conexión.',
      });
    } finally {
      setLoading(false);
    }
  }, [owner, repo, router, showAlert]);

  useEffect(() => {
    if (owner && repo) {
      loadData();
    }
  }, [owner, repo, loadData]);

  // Apply search query and status filter
  const filteredPRs = prs.filter((pr) => {
    const matchesSearch =
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(pr.number).includes(searchQuery);

    const matchesStatus =
      activeFilter === 'all' ||
      (activeFilter === 'open' && pr.state === 'open') ||
      (activeFilter === 'closed' && pr.state === 'closed');

    return matchesSearch && matchesStatus;
  });

  const getScoreColorClass = (score: number) => {
    if (score >= 8) return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';
    if (score >= 5) return 'bg-amber-950/40 text-amber-400 border-amber-900/30';
    return 'bg-rose-950/40 text-rose-400 border-rose-900/30';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col w-full">
      {/* Back button and title */}
      <div className="pb-6 border-b border-slate-900">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Volver al Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-mono text-sm">{owner}</span>
              <span className="text-slate-600 font-mono text-sm">/</span>
              <h2 className="text-xl font-bold tracking-tight text-white font-mono">{repo}</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Seleccioná una Pull Request para ver su diff e iniciar una revisión técnica.
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center justify-center space-x-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Selector de modo / Botones grandes destacados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        <button
          onClick={() => setActiveTab('prs')}
          className={`flex items-center space-x-3.5 p-5 rounded-2xl border transition-all duration-300 text-left ${
            activeTab === 'prs'
              ? 'bg-indigo-600/10 border-indigo-500/85 text-white shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50'
              : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700/80 hover:text-slate-200'
          }`}
        >
          <div className={`p-3 rounded-xl transition-colors ${activeTab === 'prs' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400'}`}>
            <GitPullRequest className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide uppercase">Analizar un Pull Request</h3>
            <p className="text-xs text-slate-500 mt-1">Revisá cambios recientes, detectá bugs y chateá sobre una propuesta de código específica.</p>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab('project');
            // Trigger analysis automatically on first tab visit if empty
            if (!projectAnalysis && !analyzingProject) {
              startProjectAnalysis();
            }
          }}
          className={`flex items-center space-x-3.5 p-5 rounded-2xl border transition-all duration-300 text-left ${
            activeTab === 'project'
              ? 'bg-indigo-600/10 border-indigo-500/85 text-white shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50'
              : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700/80 hover:text-slate-200'
          }`}
        >
          <div className={`p-3 rounded-xl transition-colors ${activeTab === 'project' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400'}`}>
            <FileCode2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide uppercase">Analizar Proyecto Completo</h3>
            <p className="text-xs text-slate-500 mt-1">Generá descripciones ejecutivas automáticas optimizadas para LinkedIn, tu CV o Portafolio.</p>
          </div>
        </button>
      </div>

      {activeTab === 'prs' && (
        <div className="animate-in fade-in duration-200 space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row gap-3.5">
            {/* Search */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Buscar por título o número de PR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex rounded-lg border border-slate-800 bg-slate-950/50 p-1 text-xs font-semibold md:w-[300px]">
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex-1 rounded px-3 py-1.5 transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setActiveFilter('open')}
                className={`flex-1 rounded px-3 py-1.5 transition-colors ${
                  activeFilter === 'open'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Abiertas
              </button>
              <button
                onClick={() => setActiveFilter('closed')}
                className={`flex-1 rounded px-3 py-1.5 transition-colors ${
                  activeFilter === 'closed'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cerradas
              </button>
            </div>
          </div>

          {/* PR Table/List */}
          {loading ? (
            /* Loading Skeletons */
            <div className="space-y-3">
              {[...Array(5)].map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse rounded-lg border border-slate-800 bg-slate-900/20 p-5 flex items-center justify-between h-[80px]"
                >
                  <div className="space-y-2.5 w-1/2">
                    <div className="h-4 bg-slate-800 rounded w-full"></div>
                    <div className="h-3 bg-slate-800 rounded w-1/3"></div>
                  </div>
                  <div className="h-7 bg-slate-800 rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : filteredPRs.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/20 p-12 text-center">
              <GitPullRequest className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400">No se encontraron Pull Requests.</p>
              <p className="text-xs text-slate-500 mt-1">Este repositorio no tiene PRs que coincidan con la búsqueda.</p>
            </div>
          ) : (
            /* Pull Requests List */
            <div className="rounded-xl border border-slate-800 bg-slate-950/30 overflow-hidden shadow-lg">
              <div className="divide-y divide-slate-800/80">
                {filteredPRs.map((pr) => (
                  <div
                    key={pr.id}
                    onClick={() => router.push(`/repos/${owner}/${repo}/pulls/${pr.number}`)}
                    className="group flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-900/10 hover:bg-slate-900/30 cursor-pointer transition-colors gap-4"
                  >
                    {/* PR Details */}
                    <div className="flex items-start space-x-3.5 min-w-0">
                      <div className={`mt-1 p-1.5 rounded-lg flex-shrink-0 border ${
                        pr.state === 'open'
                          ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40'
                          : 'bg-rose-950/30 text-rose-400 border-rose-900/40'
                      }`}>
                        <GitPullRequest className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors leading-snug">
                          {pr.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500 font-mono">
                          <span className="font-bold text-slate-400">#{pr.number}</span>
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            @{pr.user.login}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(pr.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badges / Review Action */}
                    <div className="flex items-center justify-end space-x-3.5 self-end sm:self-center">
                      {pr.hasReview && pr.reviewScore !== undefined ? (
                        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${getScoreColorClass(pr.reviewScore)}`}>
                          <Award className="h-4 w-4" />
                          <span>Review IA: {pr.reviewScore}/10</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/40 text-slate-500 text-xs font-semibold">
                          <HelpCircle className="h-4 w-4" />
                          <span>Sin revisar</span>
                        </div>
                      )}
                      <div className="text-slate-400 group-hover:text-white transition-colors bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                        <Eye className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'project' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Card to start / explain */}
          {!projectAnalysis && !analyzingProject && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-8 text-center max-w-2xl mx-auto my-8">
              <Sparkles className="h-12 w-12 text-indigo-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-white mb-2">Generar Ficha Ejecutiva del Proyecto</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                Leeremos el código fuente de los archivos clave, commits recientes y lenguajes para que la IA de Grok genere descripciones adaptadas para tu CV, LinkedIn o tu portafolio personal.
              </p>
              <button
                onClick={startProjectAnalysis}
                className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow transition-all duration-200 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              >
                <span>Analizar Proyecto Completo</span>
              </button>
            </div>
          )}

          {/* Loading state */}
          {analyzingProject && !projectAnalysis && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-12 text-center max-w-md mx-auto my-8 space-y-4 shadow-xl">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-white">Analizando estructura del proyecto...</h4>
                <p className="text-xs text-slate-500">
                  Descargando archivos fuente y metadatos de GitHub. Esto puede tomar unos segundos.
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {analysisError && !analyzingProject && (
            <div className="rounded-2xl border border-rose-900/30 bg-rose-950/10 p-8 text-center max-w-md mx-auto my-8 space-y-4">
              <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
              <div>
                <h4 className="text-sm font-semibold text-rose-400">Error al Analizar Proyecto</h4>
                <p className="text-xs text-rose-500/80 mt-1">{analysisError}</p>
              </div>
              <button
                onClick={startProjectAnalysis}
                className="inline-flex items-center space-x-2 rounded-lg bg-rose-900/20 border border-rose-900/40 text-rose-300 px-4 py-2 text-xs font-semibold hover:bg-rose-900/30 transition-colors"
              >
                <span>Reintentar Análisis</span>
              </button>
            </div>
          )}

          {/* Result view */}
          {projectAnalysis && (
            <div className="space-y-6">
              {/* Info alert while generating */}
              {analyzingProject && (
                <div className="flex items-center space-x-3 p-3.5 rounded-xl border border-indigo-900/20 bg-indigo-950/10 text-indigo-400 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Grok está analizando tu código y escribiendo las descripciones en vivo...</span>
                </div>
              )}

              {/* Analysis sections card */}
              {(() => {
                const { linkedin, cv, portfolio } = parseAnalysisSections(projectAnalysis);
                return (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden shadow-2xl divide-y divide-slate-800/80">
                    {/* LinkedIn Version */}
                    <div className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                          <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Versión para LinkedIn</h4>
                        </div>
                        {linkedin && (
                          <button
                            onClick={() => copyToClipboard(linkedin, 'linkedin')}
                            className="inline-flex items-center space-x-1.5 self-start sm:self-center px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-900/40 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
                          >
                            {copiedSection === 'linkedin' ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400 animate-in zoom-in duration-200" />
                                <span className="text-emerald-400 font-semibold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-slate-500" />
                                <span>Copiar para LinkedIn</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {linkedin || (analyzingProject ? 'Generando...' : 'No disponible.')}
                      </p>
                    </div>

                    {/* CV Version */}
                    <div className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                          <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Versión para Currículum Vitae (CV)</h4>
                        </div>
                        {cv && (
                          <button
                            onClick={() => copyToClipboard(cv, 'cv')}
                            className="inline-flex items-center space-x-1.5 self-start sm:self-center px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-900/40 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
                          >
                            {copiedSection === 'cv' ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400 animate-in zoom-in duration-200" />
                                <span className="text-emerald-400 font-semibold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-slate-500" />
                                <span>Copiar para CV</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {cv || (analyzingProject ? 'Generando...' : 'No disponible.')}
                      </p>
                    </div>

                    {/* Portfolio Version */}
                    <div className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                          <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Versión para Portafolio</h4>
                        </div>
                        {portfolio && (
                          <button
                            onClick={() => copyToClipboard(portfolio, 'portfolio')}
                            className="inline-flex items-center space-x-1.5 self-start sm:self-center px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-900/40 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
                          >
                            {copiedSection === 'portfolio' ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400 animate-in zoom-in duration-200" />
                                <span className="text-emerald-400 font-semibold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-slate-500" />
                                <span>Copiar para Portfolio</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {portfolio || (analyzingProject ? 'Generando...' : 'No disponible.')}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Reset analysis button */}
              {!analyzingProject && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={startProjectAnalysis}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/30 text-xs text-slate-400 hover:text-white hover:bg-slate-900/60 transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Volver a Analizar Proyecto</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
