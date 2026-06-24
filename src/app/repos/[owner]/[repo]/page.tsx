'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchRepoPullRequests } from '@/lib/github';
import { PullRequest } from '@/types';
import {
  ArrowLeft,
  GitPullRequest,
  Search,
  Award,
  Calendar,
  User,
  Loader2,
  RefreshCw,
  Eye,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function RepoPullRequestsPage() {
  const router = useRouter();
  const params = useParams();
  
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'open' | 'closed' | 'all'>('all');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/');
        return;
      }

      const token = localStorage.getItem('github_provider_token');
      if (!token) {
        setError('Token de GitHub no encontrado. Por favor, iniciá sesión de nuevo.');
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
    } catch (err: any) {
      console.error('Error loading PRs:', err);
      setError('No se pudieron cargar las Pull Requests. Verificá tu token y la conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (owner && repo) {
      loadData();
    }
  }, [owner, repo, router]);

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

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3.5 my-6">
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
      ) : error ? (
        /* Error state */
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-900/30 bg-rose-950/10 p-8 text-center my-6">
          <p className="text-sm font-semibold text-rose-400">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : filteredPRs.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/20 p-12 text-center my-6">
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
  );
}
