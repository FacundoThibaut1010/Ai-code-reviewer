'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SavedReview } from '@/types';
import ReviewRenderer from '@/components/ReviewRenderer';
import { useAlert } from '@/components/AlertProvider';
import {
  History,
  Search,
  Filter,
  BarChart3,
  Calendar,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Trash2,
  Loader2,
  ExternalLink,
  Check,
  Copy,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import CustomSelect from '@/components/CustomSelect';

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { id: string; fecha: string; fullFecha: string; score: number; repo: string; pr: string } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/95 p-2 sm:p-3.5 shadow-xl backdrop-blur-md text-left max-w-[180px] sm:max-w-xs select-none pointer-events-none">
        <p className="text-[8px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{data.fullFecha}</p>
        <p className="text-[10px] sm:text-xs font-bold text-white mt-1 truncate max-w-[160px] sm:max-w-none">{data.repo}</p>
        <p className="hidden sm:block text-xs text-slate-300 mt-1 truncate">PR: {data.pr}</p>
        <div className="mt-1.5 sm:mt-2.5 pt-1.5 sm:pt-2 border-t border-slate-900 flex items-center justify-between gap-3 sm:gap-5">
          <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</span>
          <span className={`text-[10px] sm:text-xs font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded ${
            data.score >= 8 ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/35' :
            data.score >= 5 ? 'bg-amber-950 text-amber-400 border border-amber-900/35' :
            'bg-rose-950 text-rose-400 border border-rose-900/35'
          }`}>{data.score} / 10</span>
        </div>
      </div>
    );
  }
  return null;
};

function ProjectAnalysisHistoryRenderer({ review }: { review: SavedReview }) {
  const content = (review.review_content || {}) as { linkedin?: string; cv?: string; portfolio?: string; };
  const [copiedSection, setCopiedSection] = useState<'linkedin' | 'cv' | 'portfolio' | null>(null);

  const copyText = (text: string | undefined, section: 'linkedin' | 'cv' | 'portfolio') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* LinkedIn Version */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Versión para LinkedIn</span>
          </div>
          {content.linkedin && (
            <button
              onClick={() => copyText(content.linkedin, 'linkedin')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-850 bg-slate-950/40 text-xs text-slate-300 hover:text-white transition-all shadow-sm active:scale-[0.98]"
            >
              {copiedSection === 'linkedin' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400 animate-in zoom-in duration-200" />
                  <span className="text-emerald-400 font-semibold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          )}
        </div>
        <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line bg-slate-950/20 p-3 rounded-lg border border-slate-900/30 font-sans">
          {content.linkedin || 'No disponible.'}
        </p>
      </div>

      {/* CV Version */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Versión para CV</span>
          </div>
          {content.cv && (
            <button
              onClick={() => copyText(content.cv, 'cv')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-850 bg-slate-950/40 text-xs text-slate-300 hover:text-white transition-all shadow-sm active:scale-[0.98]"
            >
              {copiedSection === 'cv' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400 animate-in zoom-in duration-200" />
                  <span className="text-emerald-400 font-semibold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          )}
        </div>
        <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line bg-slate-950/20 p-3 rounded-lg border border-slate-900/30 font-sans">
          {content.cv || 'No disponible.'}
        </p>
      </div>

      {/* Portfolio Version */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Versión para Portfolio</span>
          </div>
          {content.portfolio && (
            <button
              onClick={() => copyText(content.portfolio, 'portfolio')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-855 bg-slate-950/40 text-xs text-slate-300 hover:text-white transition-all shadow-sm active:scale-[0.98]"
            >
              {copiedSection === 'portfolio' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400 animate-in zoom-in duration-200" />
                  <span className="text-emerald-400 font-semibold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          )}
        </div>
        <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line bg-slate-950/20 p-3 rounded-lg border border-slate-900/30 font-sans">
          {content.portfolio || 'No disponible.'}
        </p>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { showAlert } = useAlert();
  const [reviews, setReviews] = useState<SavedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'prs' | 'projects'>('prs');

  // Expanded review state (stores ID of review currently expanded)
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/';
        return;
      }

      const { data, error: dbError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      setReviews(data || []);
    } catch (err: unknown) {
      console.error('Error fetching review history:', err);
      showAlert({
        type: 'error',
        title: 'Error de Carga',
        message: 'No se pudo cargar el historial de reviews.',
      });
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDeleteReview = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering expand/collapse
    
    showAlert({
      type: 'warning',
      title: '¿Eliminar Reseña?',
      message: '¿Estás seguro de que deseas eliminar esta reseña permanentemente de tu historial?',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          const { error: dbError } = await supabase.from('reviews').delete().eq('id', id);
          if (dbError) throw dbError;

          setReviews((prevReviews) => prevReviews.filter((r) => r.id !== id));
          if (expandedReviewId === id) setExpandedReviewId(null);
          showAlert({
            type: 'success',
            title: 'Review Eliminada',
            message: 'La reseña fue eliminada correctamente de tu historial.',
          });
        } catch (err) {
          console.error('Error deleting review:', err);
          showAlert({
            type: 'error',
            title: 'Error al Eliminar',
            message: 'Error al eliminar la reseña de la base de datos.',
          });
        }
      }
    });
  };

  // Extract unique repositories for the filter dropdown
  const uniqueRepos = Array.from(
    new Set(reviews.map((r) => `${r.repo_owner}/${r.repo_name}`))
  ).sort();

  // Apply filters
  const filteredReviews = reviews.filter((rev) => {
    // Filtrado por pestaña
    const matchesTab = activeTab === 'prs' ? rev.pr_number > 0 : rev.pr_number === 0;
    if (!matchesTab) return false;

    const matchesSearch =
      rev.pr_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.repo_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRepo =
      selectedRepo === 'all' ||
      `${rev.repo_owner}/${rev.repo_name}` === selectedRepo;

    // Date matching logic
    let matchesDate = true;
    if (selectedDateFilter !== 'all') {
      const reviewDate = new Date(rev.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - reviewDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (selectedDateFilter === 'today') {
        matchesDate = reviewDate.toDateString() === now.toDateString();
      } else if (selectedDateFilter === 'week') {
        matchesDate = diffDays <= 7;
      } else if (selectedDateFilter === 'month') {
        matchesDate = diffDays <= 30;
      }
    }
    return matchesSearch && matchesRepo && matchesDate;
  });

  // Generate chart data chronologically (only for PR reviews, excluding project analyses)
  const prReviews = reviews.filter((r) => r.pr_number > 0);
  const chartData = [...prReviews]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((r) => ({
      id: r.id,
      fecha: new Date(r.created_at).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      }),
      fullFecha: new Date(r.created_at).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      score: r.score,
      repo: `${r.repo_owner}/${r.repo_name}`,
      pr: r.pr_title,
    }));

  // Calculate statistics (only for PR reviews)
  const totalReviews = prReviews.length;
  
  const totalBugs = prReviews.reduce((sum, r) => {
    const bugsList = r.review_content?.bugs || [];
    return sum + bugsList.length;
  }, 0);

  const averageScore =
    totalReviews > 0
      ? (prReviews.reduce((sum, r) => sum + r.score, 0) / totalReviews).toFixed(1)
      : '0.0';

  const toggleExpand = (id: string) => {
    setExpandedReviewId(expandedReviewId === id ? null : id);
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 8) return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';
    if (score >= 5) return 'bg-amber-950/40 text-amber-400 border-amber-900/30';
    return 'bg-rose-950/40 text-rose-400 border-rose-900/30';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col w-full">
      {/* Header */}
      <div className="pb-6 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center">
            <History className="mr-2.5 h-6 w-6 text-indigo-400" />
            Historial de Actividades
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {activeTab === 'prs'
              ? 'Revisá los reportes y estadísticas de tus Pull Requests auditadas anteriormente.'
              : 'Consultá y copiá las descripciones de tus proyectos para CV, LinkedIn o tu portafolio personal.'}
          </p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="grid grid-cols-2 sm:inline-flex border border-slate-800 mt-8 mb-6 bg-slate-950 p-1.5 rounded-2xl w-full sm:w-auto gap-1 shadow-md self-start">
        <button
          onClick={() => {
            setActiveTab('prs');
            setExpandedReviewId(null);
            setSelectedRepo('all');
            setSearchQuery('');
            setSelectedDateFilter('all');
          }}
          className={`px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap text-center ${
            activeTab === 'prs'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          Auditorías de PRs
        </button>
        <button
          onClick={() => {
            setActiveTab('projects');
            setExpandedReviewId(null);
            setSelectedRepo('all');
            setSearchQuery('');
            setSelectedDateFilter('all');
          }}
          className={`px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap text-center ${
            activeTab === 'projects'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          Análisis de Proyectos
        </button>
      </div>

      {/* Inline errors removed, replaced by Sileo alert context */}

      {loading ? (
        <div className="flex flex-1 items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {activeTab === 'prs' && (
            <>
              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-in fade-in duration-200">
                {/* Total reviews card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
                      Total Reviews
                    </p>
                    <h3 className="text-2xl font-bold text-white mt-1">{totalReviews}</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>

                {/* Total bugs card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
                      Bugs Detectados
                    </p>
                    <h3 className="text-2xl font-bold text-white mt-1">{totalBugs}</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>

                {/* Average score card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
                      Score Promedio
                    </p>
                    <h3 className="text-2xl font-bold text-white mt-1">{averageScore} / 10</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Award className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Line Chart showing historical scores */}
              {isMounted && chartData.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/15 p-5 mb-6 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Evolución de Score Histórico</h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-sans">Calidad y estabilidad del código a lo largo del tiempo</p>
                    </div>
                  </div>
                  <div className="w-full overflow-hidden h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} vertical={false} />
                        <XAxis 
                          dataKey="fecha" 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          dy={8}
                        />
                        <YAxis 
                          domain={[0, 10]} 
                          ticks={[0, 2, 4, 6, 8, 10]} 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          dx={-4}
                        />
                        <RechartsTooltip 
                          content={<CustomTooltip />} 
                          cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#6366F1" 
                          strokeWidth={2.5}
                          activeDot={{ r: 6, stroke: '#818cf8', strokeWidth: 1.5, fill: '#0f172a' }}
                          dot={{ r: 4, stroke: '#6366F1', strokeWidth: 1.5, fill: '#0f172a' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Filters Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 mb-6">
            {/* Search query */}
            <div className="relative md:col-span-6">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder={activeTab === 'prs' ? "Buscar por título de PR o repositorio..." : "Buscar por repositorio..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>

            {/* Repo filter */}
            <div className="md:col-span-3">
              <CustomSelect
                value={selectedRepo}
                onChange={setSelectedRepo}
                options={[
                  { value: 'all', label: 'Todos los repos' },
                  ...uniqueRepos.map((repo) => ({ value: repo, label: repo })),
                ]}
                icon={Filter}
              />
            </div>

            {/* Date filter */}
            <div className="md:col-span-3">
              <CustomSelect
                value={selectedDateFilter}
                onChange={(val) => setSelectedDateFilter(val as 'all' | 'today' | 'week' | 'month')}
                options={[
                  { value: 'all', label: 'Cualquier fecha' },
                  { value: 'today', label: 'Hoy' },
                  { value: 'week', label: 'Últimos 7 días' },
                  { value: 'month', label: 'Últimos 30 días' },
                ]}
                icon={Calendar}
              />
            </div>
          </div>

          {/* List of Saved Reviews */}
          {filteredReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/20 p-12 text-center my-6">
              <FolderOpen className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400 font-sans">
                {activeTab === 'prs' ? 'No hay reviews guardadas.' : 'No hay análisis de proyectos guardados.'}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                {activeTab === 'prs'
                  ? 'Realizá auditorías en tus repositorios y guardalas para verlas acá.'
                  : 'Realizá análisis de proyectos completos y guardalos para verlos acá.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((rev) => {
                const isExpanded = expandedReviewId === rev.id;
                const isProjectAnalysis = rev.pr_number === 0;
                
                const bugsCount = rev.review_content?.bugs?.length || 0;
                const sugCount = rev.review_content?.sugerencias?.length || 0;
                const perfCount = rev.review_content?.performance?.length || 0;
                const secCount = rev.review_content?.security?.length || 0;

                return (
                  <div
                    key={rev.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden shadow-md"
                  >
                    {/* Item Summary Header */}
                    <div
                      onClick={() => toggleExpand(rev.id)}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 bg-slate-900/10 hover:bg-slate-900/20 cursor-pointer transition-colors gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-semibold text-slate-400 truncate">
                            {rev.repo_owner}/{rev.repo_name}
                          </span>
                          <span className="text-slate-700 font-mono text-xs">•</span>
                          {isProjectAnalysis ? (
                            <span className="font-mono text-xs text-indigo-400 font-bold uppercase tracking-wider">Ficha de Proyecto</span>
                          ) : (
                            <span className="font-mono text-xs text-slate-500">PR #{rev.pr_number}</span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-200 truncate pr-4 font-sans">
                          {isProjectAnalysis ? `Ficha Ejecutiva: ${rev.repo_name}` : rev.pr_title}
                        </h3>
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          {isProjectAnalysis ? (
                            <span className="rounded bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 text-[9px] text-indigo-400 font-mono font-bold">
                              LinkedIn, CV & Portafolio
                            </span>
                          ) : (
                            <>
                              {bugsCount > 0 && (
                                <span className="rounded bg-rose-500/15 border border-rose-500/25 px-2 py-0.5 text-[9px] text-rose-400 font-mono font-bold">
                                  {bugsCount} Bugs
                                </span>
                              )}
                              {sugCount > 0 && (
                                <span className="rounded bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[9px] text-amber-400 font-mono font-bold">
                                  {sugCount} Mejoras
                                </span>
                              )}
                              {perfCount > 0 && (
                                <span className="rounded bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[9px] text-emerald-400 font-mono font-bold">
                                  {perfCount} Perf
                                </span>
                              )}
                              {secCount > 0 && (
                                <span className="rounded bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 text-[9px] text-indigo-400 font-mono font-bold">
                                  {secCount} Sec
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="flex flex-col items-end text-right font-mono text-[10px] text-slate-500">
                          <span className="text-slate-400">{isProjectAnalysis ? 'Fecha de Análisis' : 'Fecha del Review'}</span>
                          <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Score badge (only for PR reviews) */}
                        {!isProjectAnalysis && (
                          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${getScoreColorClass(rev.score)}`}>
                            <span>Score: {rev.score}/10</span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center space-x-2">
                          <a
                            href={rev.pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                            title={isProjectAnalysis ? "Ver Repositorio en GitHub" : "Ver PR en GitHub"}
                          >
                            <ExternalLink className="h-4.5 w-4.5" />
                          </a>
                          <button
                            onClick={(e) => handleDeleteReview(rev.id, e)}
                            className="p-2 rounded-lg border border-transparent text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/30 transition-all"
                            title={isProjectAnalysis ? "Eliminar análisis" : "Eliminar review"}
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                          <div className="p-2 text-slate-400">
                            {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Review View Expanded */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 p-6 bg-slate-950/60">
                        {isProjectAnalysis ? (
                          <ProjectAnalysisHistoryRenderer review={rev} />
                        ) : (
                          <ReviewRenderer review={rev.review_content} isStreaming={false} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
