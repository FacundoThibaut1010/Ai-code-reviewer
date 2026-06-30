'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SavedReview } from '@/types';
import { useAlert } from '@/components/AlertProvider';
import { GitCompare, ArrowLeftRight, AlertTriangle, ShieldAlert, Award, FileText } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

export default function ComparePage() {
  const { showAlert } = useAlert();
  const [reviews, setReviews] = useState<SavedReview[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection states
  const [selectedId1, setSelectedId1] = useState<string>('');
  const [selectedId2, setSelectedId2] = useState<string>('');
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = '/';
          return;
        }

        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        const prReviews = (data || []).filter((r) => r.pr_number > 0);
        setReviews(prReviews);
      } catch (err) {
        console.error('Error loading reviews for comparison:', err);
        showAlert({
          type: 'error',
          title: 'Error de Carga',
          message: 'No se pudo cargar el historial para comparar reviews.',
        });
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, [showAlert]);

  const review1 = reviews.find(r => r.id === selectedId1);
  const review2 = reviews.find(r => r.id === selectedId2);

  // Helper to extract counts
  const getReviewStats = (r: SavedReview | undefined) => {
    if (!r) return { score: 0, bugs: 0, sugs: 0, sec: 0, perf: 0, comp: { label: 'Baja', value: 1 } };
    const bugs = r.review_content?.bugs?.length || 0;
    const sugs = r.review_content?.sugerencias?.length || 0;
    const sec = r.review_content?.security?.length || 0;
    const perf = r.review_content?.performance?.length || 0;
    const total = bugs + sugs + sec + perf;
    
    let comp = { label: 'Baja', value: 1 };
    if (total > 8) comp = { label: 'Alta', value: 3 };
    else if (total > 3) comp = { label: 'Media', value: 2 };
    
    return {
      score: r.score,
      bugs,
      sugs,
      sec,
      perf,
      comp
    };
  };

  const stats1 = getReviewStats(review1);
  const stats2 = getReviewStats(review2);

  // Helper to determine winner/loser styles
  // type: 'higher' (higher is better, e.g. score) or 'lower' (lower is better, e.g. bugs, complexity)
  const getComparisonStyles = (val1: number, val2: number, type: 'higher' | 'lower') => {
    if (!review1 || !review2) return { cell1: 'text-slate-300', cell2: 'text-slate-300' };
    if (val1 === val2) return { cell1: 'text-indigo-400 font-semibold', cell2: 'text-indigo-400 font-semibold' };
    
    const isWinner1 = type === 'higher' ? val1 > val2 : val1 < val2;
    
    return {
      cell1: isWinner1 
        ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 font-semibold rounded-lg px-2.5 py-1' 
        : 'bg-rose-950/20 text-rose-400 border border-rose-900/30 font-semibold rounded-lg px-2.5 py-1',
      cell2: !isWinner1 
        ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 font-semibold rounded-lg px-2.5 py-1' 
        : 'bg-rose-950/20 text-rose-400 border border-rose-900/30 font-semibold rounded-lg px-2.5 py-1'
    };
  };

  const stylesScore = getComparisonStyles(stats1.score, stats2.score, 'higher');
  const stylesBugs = getComparisonStyles(stats1.bugs, stats2.bugs, 'lower');
  const stylesSugs = getComparisonStyles(stats1.sugs, stats2.sugs, 'lower');
  const stylesSec = getComparisonStyles(stats1.sec, stats2.sec, 'lower');
  const stylesComp = getComparisonStyles(stats1.comp.value, stats2.comp.value, 'lower');

  const handleCompare = () => {
    if (!selectedId1 || !selectedId2) {
      showAlert({
        type: 'warning',
        title: 'Selección Incompleta',
        message: 'Por favor seleccioná dos reviews de los desplegables para iniciar la comparación.',
      });
      return;
    }
    if (selectedId1 === selectedId2) {
      showAlert({
        type: 'warning',
        title: 'Reviews Idénticos',
        message: 'Por favor seleccioná dos reviews diferentes para compararlos entre sí.',
      });
      return;
    }
    setShowComparison(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <main className="flex-1 flex flex-col w-full">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col w-full">
          {/* Header */}
          <div className="pb-6 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center">
                <GitCompare className="mr-2.5 h-6 w-6 text-indigo-400" />
                Comparador de Pull Requests
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Seleccioná dos reportes guardados de tu historial para comparar la calidad de código métrica a métrica.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-6 flex-1">
              {/* Selectors card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  {/* Select 1 */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Primer Review (PR A)
                    </label>
                    <CustomSelect
                      value={selectedId1}
                      onChange={(val) => {
                        setSelectedId1(val);
                        setShowComparison(false);
                      }}
                      options={[
                        { value: '', label: 'Seleccionar review...' },
                        ...reviews.map((r) => ({
                          value: r.id,
                          label: `[${r.repo_name}] ${r.pr_title} (${new Date(r.created_at).toLocaleDateString()})`
                        }))
                      ]}
                      icon={GitCompare}
                    />
                  </div>

                  {/* Select 2 */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Segundo Review (PR B)
                    </label>
                    <CustomSelect
                      value={selectedId2}
                      onChange={(val) => {
                        setSelectedId2(val);
                        setShowComparison(false);
                      }}
                      options={[
                        { value: '', label: 'Seleccionar review...' },
                        ...reviews.map((r) => ({
                          value: r.id,
                          label: `[${r.repo_name}] ${r.pr_title} (${new Date(r.created_at).toLocaleDateString()})`
                        }))
                      ]}
                      icon={GitCompare}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleCompare}
                    className="flex items-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 transition-colors active:scale-[0.98]"
                  >
                    <ArrowLeftRight className="h-4.5 w-4.5" />
                    <span>Comparar Reportes</span>
                  </button>
                </div>
              </div>

              {/* Comparison Results */}
              {showComparison && review1 && review2 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-[650px] w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/40">
                          <th className="p-4 font-bold text-slate-400 w-1/4">Métrica</th>
                          <th className="p-4 font-bold text-slate-100 text-center w-3/8 border-l border-slate-800 bg-slate-900/20">
                            PR A: {review1.pr_title}
                            <span className="block text-xs font-semibold text-slate-500 mt-1 font-mono">
                              {review1.repo_owner}/{review1.repo_name}
                            </span>
                          </th>
                          <th className="p-4 font-bold text-slate-100 text-center w-3/8 border-l border-slate-800 bg-slate-900/20">
                            PR B: {review2.pr_title}
                            <span className="block text-xs font-semibold text-slate-500 mt-1 font-mono">
                              {review2.repo_owner}/{review2.repo_name}
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {/* Repositorio */}
                        <tr>
                          <td className="p-4 font-bold text-slate-400 flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-slate-500" />
                            Repositorio y PR
                          </td>
                          <td className="p-4 text-center border-l border-slate-900">
                            <span className="text-white font-medium">{review1.pr_title}</span>
                            <span className="block text-xs text-slate-400 mt-0.5 font-mono">{review1.repo_owner}/{review1.repo_name}</span>
                          </td>
                          <td className="p-4 text-center border-l border-slate-900">
                            <span className="text-white font-medium">{review2.pr_title}</span>
                            <span className="block text-xs text-slate-400 mt-0.5 font-mono">{review2.repo_owner}/{review2.repo_name}</span>
                          </td>
                        </tr>

                        {/* Score General */}
                        <tr>
                          <td className="p-4 font-bold text-slate-400 flex items-center">
                            <Award className="mr-2 h-4 w-4 text-indigo-400" />
                            Score General
                          </td>
                          <td className="p-4 text-center border-l border-slate-900">
                            <span className={stylesScore.cell1}>{stats1.score} / 10</span>
                          </td>
                          <td className="p-4 text-center border-l border-slate-900">
                            <span className={stylesScore.cell2}>{stats2.score} / 10</span>
                          </td>
                        </tr>

                        {/* Bugs */}
                        <tr>
                          <td className="p-4 font-bold text-slate-400 flex items-center">
                            <AlertTriangle className="mr-2 h-4 w-4 text-rose-400" />
                            Bugs Detectados
                          </td>
                          <td className="p-4 text-center border-l border-slate-900">
                            <span className={stylesBugs.cell1}>{stats1.bugs}</span>
                          </td>
                          <td className="p-4 text-center border-l border-slate-900">
                            <span className={stylesBugs.cell2}>{stats2.bugs}</span>
                          </td>
                        </tr>

                        {/* Sugerencias */}
                        <tr>
                          <td className="p-4 font-bold text-slate-400 flex items-center">
                            <Award className="mr-2 h-4 w-4 text-amber-400" />
                            Sugerencias
                          </td>
                          <td className="p-4 text-center border-l border-slate-900">
                            <span className={stylesSugs.cell1}>{stats1.sugs}</span>
                          </td>
                          <td className="p-4 text-center border-l border-slate-900">
                            <span className={stylesSugs.cell2}>{stats2.sugs}</span>
                          </td>
                        </tr>

                        {/* Seguridad */}
                        <tr>
                          <td className="p-4 font-bold text-slate-400 flex items-center">
                            <ShieldAlert className="mr-2 h-4 w-4 text-red-500" />
                            Issues de Seguridad
                          </td>
                          <td className="p-4 text-center border-l border-slate-900">
                            <span className={stylesSec.cell1}>{stats1.sec}</span>
                          </td>
                          <td className="p-4 text-center border-l border-slate-900">
                            <span className={stylesSec.cell2}>{stats2.sec}</span>
                          </td>
                        </tr>

                        {/* Complejidad */}
                        <tr>
                          <td className="p-4 font-bold text-slate-400 flex items-center">
                            <GitCompare className="mr-2 h-4 w-4 text-slate-500" />
                            Complejidad
                          </td>
                          <td className="p-4 text-center border-l border-slate-900">
                            <span className={stylesComp.cell1}>{stats1.comp.label}</span>
                          </td>
                          <td className="p-4 text-center border-l border-slate-900">
                            <span className={stylesComp.cell2}>{stats2.comp.label}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
