'use client';

import React, { useState, useEffect } from 'react';
import RobotLogo from '@/components/RobotLogo';

interface LoadingScreenProps {
  isDataReady?: boolean;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
}

export default function LoadingScreen({
  isDataReady = false,
  onComplete,
  title = 'AI Code Reviewer',
  subtitle = 'Iniciando sistema de auditoría inteligente'
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Inicializando núcleos...');

  useEffect(() => {
    let currentProgress = 0;
    const intervalTime = 60;

    const interval = setInterval(() => {
      // If data is ready, accelerate progress. Otherwise cap at 90%
      if (isDataReady) {
        currentProgress = Math.min(currentProgress + (Math.floor(Math.random() * 10) + 12), 100);
      } else {
        if (currentProgress < 90) {
          currentProgress = Math.min(currentProgress + (Math.floor(Math.random() * 4) + 1), 90);
        }
      }

      setProgress(currentProgress);

      // Dynamic tech status updates
      if (currentProgress < 20) {
        setStatusText('Cargando módulos de seguridad...');
      } else if (currentProgress < 45) {
        setStatusText('Conectando con la API de Claude 3.5 Sonnet...');
      } else if (currentProgress < 70) {
        setStatusText('Sincronizando tokens de sesión...');
      } else if (currentProgress < 90) {
        setStatusText('Preparando panel de control...');
      } else if (currentProgress < 100) {
        setStatusText('Finalizando configuración...');
      } else {
        setStatusText('Sistemas listos.');
        clearInterval(interval);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isDataReady]);

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        if (onComplete) onComplete();
      }, 350); // Delay to let user see 100% complete state
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-slate-950 p-6 min-h-screen w-full relative overflow-hidden select-none">
      {/* Abstract technological ambient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-orange-600/5 blur-[80px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-600/5 blur-[120px] pointer-events-none"></div>

      <div className="relative flex flex-col items-center z-10 w-full max-w-sm">
        {/* Pulsing ring behind the robot */}
        <div className="absolute -inset-4 rounded-full bg-orange-500/10 blur-xl opacity-30 animate-pulse"></div>
        
        {/* Robot Logo Display */}
        <div className="mb-8 relative p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-[0_0_20px_rgba(249,115,22,0.05)]">
          <RobotLogo size={84} interactive={true} />
        </div>

        {/* Brand Text */}
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        <p className="text-xs text-slate-400 mt-1.5 text-center font-medium opacity-90 max-w-[260px]">{subtitle}</p>

        {/* Progress Bar Container */}
        <div className="mt-8 flex flex-col items-center w-full">
          {/* Percentage */}
          <span className="text-sm font-semibold tracking-wider text-orange-400 font-mono">
            {progress}%
          </span>

          {/* Progress bar tracks */}
          <div className="mt-2.5 h-1.5 w-60 bg-slate-900 border border-slate-800/80 rounded-full overflow-hidden relative shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(249,115,22,0.6)] rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Dynamic Status Text */}
          <span className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest min-h-[16px] text-center w-full">
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}
