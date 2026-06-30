'use client';

import React, { useState } from 'react';
import { AIReviewContent } from '@/types';
import {
  AlertTriangle,
  Lightbulb,
  Zap,
  ShieldAlert,
  Award,
  CheckCircle,
  Loader2,
  FileText,
} from 'lucide-react';

interface ReviewRendererProps {
  review: Partial<AIReviewContent>;
  isStreaming: boolean;
}

type TabType = 'bugs' | 'sugerencias' | 'performance' | 'security' | 'resumen';

export default function ReviewRenderer({ review, isStreaming }: ReviewRendererProps) {
  const [activeTab, setActiveTab] = useState<TabType>('resumen');

  const bugs = review.bugs || [];
  const sugerencias = review.sugerencias || [];
  const performance = review.performance || [];
  const security = review.security || [];
  const score = review.score;
  const justification = review.justification;

  // Determine score color
  const getScoreColor = (val: number | undefined) => {
    if (val === undefined) return 'text-slate-400 border-slate-800';
    if (val >= 8) return 'text-emerald-400 border-emerald-500 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
    if (val >= 5) return 'text-amber-400 border-amber-500 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
    return 'text-rose-400 border-rose-500 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-xl overflow-hidden">
      {/* Header with Streaming Status and Score */}
      <div className="border-b border-slate-800 bg-slate-900/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Análisis Automático con IA</h3>
            <p className="text-xs text-slate-400">
              {isStreaming ? (
                <span className="flex items-center text-indigo-400 font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Generando revisión en tiempo real...
                </span>
              ) : (
                'Análisis de código completado con Gemini'
              )}
            </p>
          </div>
        </div>

        {/* Score Badge */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Puntaje General
          </span>
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full border-2 font-mono text-xl font-bold transition-all ${getScoreColor(
              score
            )}`}
          >
            {score !== undefined ? score : '-'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/10 overflow-x-auto">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`flex items-center space-x-2 border-b-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'resumen'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Resumen</span>
        </button>

        <button
          onClick={() => setActiveTab('bugs')}
          className={`flex items-center space-x-2 border-b-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'bugs'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Bugs</span>
          {bugs.length > 0 && (
            <span className="ml-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] text-rose-400 font-bold">
              {bugs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sugerencias')}
          className={`flex items-center space-x-2 border-b-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'sugerencias'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="h-4 w-4" />
          <span>Mejoras</span>
          {sugerencias.length > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-400 font-bold">
              {sugerencias.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center space-x-2 border-b-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'performance'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Performance</span>
          {performance.length > 0 && (
            <span className="ml-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-400 font-bold">
              {performance.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center space-x-2 border-b-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Seguridad</span>
          {security.length > 0 && (
            <span className="ml-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] text-indigo-400 font-bold">
              {security.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-6 min-h-[250px] bg-slate-950">
        {/* Resumen */}
        {activeTab === 'resumen' && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Justificación de la Calificación
            </h4>
            {justification ? (
              <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
                {justification}
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                {isStreaming ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    <span className="text-sm font-medium text-slate-400">Generando justificación...</span>
                  </div>
                ) : (
                  <p className="text-sm">El resumen y justificación aparecerán aquí.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bugs */}
        {activeTab === 'bugs' && (
          <div className="space-y-4">
            {bugs.length > 0 ? (
              <div className="space-y-3">
                {bugs.map((bug, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-rose-950/40 bg-rose-950/10 p-4 text-left transition-colors hover:border-rose-900/50"
                  >
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-mono text-xs font-semibold text-rose-300 truncate max-w-full">
                            {bug.file}
                          </span>
                          {bug.line && (
                            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[10px] text-rose-300 font-semibold">
                              Línea {bug.line}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-300">{bug.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                {isStreaming ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                    <span className="text-sm">Escaneando bugs...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle className="h-8 w-8 text-emerald-400/80 mb-2" />
                    <p className="text-sm text-slate-400">No se detectaron bugs.</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sugerencias */}
        {activeTab === 'sugerencias' && (
          <div className="space-y-4">
            {sugerencias.length > 0 ? (
              <div className="space-y-3">
                {sugerencias.map((sug, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-amber-950/40 bg-amber-950/10 p-4 text-left transition-colors hover:border-amber-900/50"
                  >
                    <div className="flex items-start space-x-3">
                      <Lightbulb className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-mono text-xs font-semibold text-amber-300 truncate max-w-full">
                            {sug.file}
                          </span>
                          {sug.line && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] text-amber-300 font-semibold">
                              Línea {sug.line}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-300">{sug.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                {isStreaming ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                    <span className="text-sm">Analizando mejoras...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle className="h-8 w-8 text-emerald-400/80 mb-2" />
                    <p className="text-sm text-slate-400">No hay sugerencias de mejora.</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Performance */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            {performance.length > 0 ? (
              <div className="space-y-3">
                {performance.map((perf, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-emerald-950/40 bg-emerald-950/10 p-4 text-left transition-colors hover:border-emerald-900/50"
                  >
                    <div className="flex items-start space-x-3">
                      <Zap className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-semibold text-emerald-300 truncate block">
                          {perf.file}
                        </span>
                        <p className="mt-2 text-sm text-slate-300">{perf.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                {isStreaming ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                    <span className="text-sm">Analizando performance...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle className="h-8 w-8 text-emerald-400/80 mb-2" />
                    <p className="text-sm text-slate-400">No se encontraron problemas de performance.</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            {security.length > 0 ? (
              <div className="space-y-3">
                {security.map((sec, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-indigo-950/40 bg-indigo-950/10 p-4 text-left transition-colors hover:border-indigo-900/50"
                  >
                    <div className="flex items-start space-x-3">
                      <ShieldAlert className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-semibold text-indigo-300 truncate block">
                          {sec.file}
                        </span>
                        <p className="mt-2 text-sm text-slate-300">{sec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                {isStreaming ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    <span className="text-sm">Escaneando brechas de seguridad...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle className="h-8 w-8 text-emerald-400/80 mb-2" />
                    <p className="text-sm text-slate-400">No se encontraron vulnerabilidades de seguridad.</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
