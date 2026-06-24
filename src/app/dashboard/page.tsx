'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchUserRepos } from '@/lib/github';
import { Repository } from '@/types';
import {
  Search,
  Filter,
  Star,
  GitFork,
  Lock,
  Globe,
  FolderGit,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'public' | 'private'>('all');

  const loadData = useCallback(async () => {
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
        await supabase.auth.signOut();
        router.replace('/');
        return;
      }

      const fetchedRepos = await fetchUserRepos(token);
      setRepos(fetchedRepos);
    } catch (err: unknown) {
      console.error('Error fetching user repositories:', err);
      const errMessage = err instanceof Error ? err.message : '';
      if (errMessage.includes('401') || errMessage.includes('token')) {
        setError('Tu sesión de GitHub ha expirado. Por favor, volvé a iniciar sesión.');
        localStorage.removeItem('github_provider_token');
        await supabase.auth.signOut();
        router.replace('/');
      } else {
        setError('No se pudieron cargar los repositorios. Verificá tu conexión a internet.');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract unique languages for filter dropdown
  const uniqueLanguages = Array.from(
    new Set(repos.map((r) => r.language).filter((lang): lang is string => !!lang))
  ).sort();

  // Apply filters
  const filteredRepos = repos.filter((repo) => {
    const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLanguage =
      selectedLanguage === 'all' || repo.language === selectedLanguage;

    const matchesType =
      selectedType === 'all' ||
      (selectedType === 'private' && repo.private) ||
      (selectedType === 'public' && !repo.private);

    return matchesSearch && matchesLanguage && matchesType;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col w-full">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center">
            <FolderGit className="mr-2.5 h-6 w-6 text-indigo-400" />
            Mis Repositorios
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Seleccioná un repositorio para auditar sus Pull Requests.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center justify-center space-x-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sincronizar</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 my-6">
        {/* Search */}
        <div className="relative md:col-span-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar repositorio por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Language Filter */}
        <div className="relative md:col-span-3">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Filter className="h-4 w-4 text-slate-500" />
          </div>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-800 bg-slate-950/50 py-2.5 pl-9 pr-10 text-sm text-slate-300 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Todos los lenguajes</option>
            {uniqueLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
            <ChevronRight className="h-4 w-4 rotate-90" />
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex rounded-lg border border-slate-800 bg-slate-950/50 p-1 md:col-span-3 text-xs font-semibold">
          <button
            onClick={() => setSelectedType('all')}
            className={`flex-1 rounded px-3 py-1.5 transition-colors ${
              selectedType === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedType('public')}
            className={`flex-1 rounded px-3 py-1.5 transition-colors ${
              selectedType === 'public'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Públicos
          </button>
          <button
            onClick={() => setSelectedType('private')}
            className={`flex-1 rounded px-3 py-1.5 transition-colors ${
              selectedType === 'private'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Privados
          </button>
        </div>
      </div>

      {/* Main content Area */}
      {loading ? (
        /* Loading Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-3.5 h-[160px]"
            >
              <div className="flex justify-between">
                <div className="h-5 bg-slate-800 rounded w-2/3"></div>
                <div className="h-5 bg-slate-800 rounded w-16"></div>
              </div>
              <div className="h-4 bg-slate-800 rounded w-full"></div>
              <div className="h-3 bg-slate-800 rounded w-5/6"></div>
              <div className="flex space-x-4 pt-2">
                <div className="h-4 bg-slate-800 rounded w-12"></div>
                <div className="h-4 bg-slate-800 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-900/30 bg-rose-950/10 p-8 text-center my-6">
          <p className="text-sm font-semibold text-rose-400">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : filteredRepos.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/20 p-12 text-center my-6">
          <FolderGit className="h-10 w-10 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">No se encontraron repositorios.</p>
          <p className="text-xs text-slate-500 mt-1">Intentá cambiar los filtros o los términos de búsqueda.</p>
        </div>
      ) : (
        /* Repositories Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              onClick={() => router.push(`/repos/${repo.owner.login}/${repo.name}`)}
              className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/20 p-5 flex flex-col justify-between hover:bg-slate-900/40 hover:border-indigo-500/40 transition-all duration-300 shadow-md glow-card"
            >
              <div className="space-y-2">
                {/* Repo Title & Privacy */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 font-mono transition-colors truncate">
                    {repo.name}
                  </h3>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                    repo.private
                      ? 'bg-rose-950/20 text-rose-400 border-rose-900/30'
                      : 'bg-indigo-950/20 text-indigo-400 border-indigo-900/30'
                  }`}>
                    {repo.private ? (
                      <Lock className="h-2.5 w-2.5 mr-1" />
                    ) : (
                      <Globe className="h-2.5 w-2.5 mr-1" />
                    )}
                    {repo.private ? 'Privado' : 'Público'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-2 h-8 leading-relaxed">
                  {repo.description || 'Sin descripción disponible.'}
                </p>
              </div>

              {/* Footer Meta */}
              <div className="flex items-center justify-between border-t border-slate-900/60 pt-4 mt-4 text-[11px] font-medium text-slate-500 font-mono">
                <div className="flex items-center space-x-3">
                  {repo.language && (
                    <span className="flex items-center">
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 mr-1.5 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Star className="h-3 w-3 mr-1 text-amber-500/80 fill-current" />
                    {repo.stargazers_count}
                  </span>
                  <span className="flex items-center">
                    <GitFork className="h-3 w-3 mr-1 text-slate-500" />
                    {repo.forks_count}
                  </span>
                </div>
                <span className="text-[10px] text-slate-600">
                  Actualizado {new Date(repo.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
