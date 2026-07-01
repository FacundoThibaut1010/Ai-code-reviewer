'use client';

import React, { useState, useEffect } from 'react';
import { sileo } from 'sileo';
import {
  Sparkles,
  Split,
  GitPullRequest,
  Bookmark,
  History,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  FolderGit
} from 'lucide-react';

interface TourStep {
  title: string;
  description: React.ReactNode;
  icon: React.ReactNode;
}

export default function WelcomeTour() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    setMounted(true);
    const completed = localStorage.getItem('tutorial_completed');
    if (completed !== 'true') {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Apply highlighting class on Paso 2
    const el = document.getElementById('tour-repo-list');
    if (currentStep === 2 && el) {
      el.classList.add('tour-highlight-active');
      // Scroll to repositories list so user can see it highlighted
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      if (el) {
        el.classList.remove('tour-highlight-active');
      }
    };
  }, [currentStep, isOpen]);

  if (!mounted || !isOpen) {
    return null;
  }

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const completeTour = () => {
    localStorage.setItem('tutorial_completed', 'true');
    setIsOpen(false);
    sileo.success({
      title: 'Tutorial completado — ¡a codear!',
      duration: 2500
    });
  };

  const steps: TourStep[] = [
    {
      title: 'Bienvenido a AI Code Reviewer',
      description: (
        <p className="text-slate-300">
          Analizá tus repositorios y Pull Requests automáticamente con Inteligencia Artificial.
          Mejorá la calidad de tu código, detectá bugs y generá descripciones profesionales en segundos.
        </p>
      ),
      icon: <Sparkles className="h-8 w-8" />
    },
    {
      title: 'Elegir un repositorio',
      description: (
        <p className="text-slate-300">
          Seleccioná cualquiera de tus repositorios de GitHub para empezar. Podés buscar por nombre o descripción usando el buscador de arriba.
        </p>
      ),
      icon: <FolderGit className="h-8 w-8" />
    },
    {
      title: 'Dos opciones disponibles',
      description: (
        <div className="text-slate-300 text-left space-y-3">
          <p>Dentro de cada repositorio vas a tener dos acciones principales:</p>
          <div className="flex gap-3 items-start bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
            <span className="text-indigo-400 mt-0.5">•</span>
            <p className="text-xs">
              <strong className="text-white">Analizar un Pull Request:</strong> para revisar cambios de código específicos, detectar errores y recibir recomendaciones precisas.
            </p>
          </div>
          <div className="flex gap-3 items-start bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
            <span className="text-purple-400 mt-0.5">•</span>
            <p className="text-xs">
              <strong className="text-white">Analizar el Proyecto Completo:</strong> para obtener un análisis global y generar una descripción profesional estructurada de todo el repositorio.
            </p>
          </div>
        </div>
      ),
      icon: <Split className="h-8 w-8" />
    },
    {
      title: 'Analizar un Pull Request',
      description: (
        <p className="text-slate-300">
          Al entrar a un repositorio verás la lista de PRs disponibles. Al hacer click en uno, podrás ver los cambios en el código y pulsar un botón para que la IA lo analice. El análisis aparecerá en tiempo real, palabra por palabra.
        </p>
      ),
      icon: <GitPullRequest className="h-8 w-8" />
    },
    {
      title: 'Guardar el review',
      description: (
        <p className="text-slate-300">
          Una vez generado el análisis, podés guardarlo con el botón <strong className="text-white">&quot;Guardar Review&quot;</strong> para consultarlo después en el Historial. El review guardado incluye el score, los bugs detectados y las sugerencias.
        </p>
      ),
      icon: <Bookmark className="h-8 w-8" />
    },
    {
      title: 'Historial',
      description: (
        <p className="text-slate-300">
          En la sección Historial podés ver todos tus reviews guardados, comparar PRs entre sí y analizar cómo evolucionó la calidad de tu código a lo largo del tiempo.
        </p>
      ),
      icon: <History className="h-8 w-8" />
    },
    {
      title: '¡Ya estás listo para empezar!',
      description: (
        <p className="text-slate-300">
          Ya completaste el tour de bienvenida. Ahora estás listo para explorar la plataforma y automatizar tus revisiones de código.
        </p>
      ),
      icon: <CheckCircle2 className="h-8 w-8" />
    }
  ];

  const currentStepData = steps[currentStep - 1];

  // Helper for step colors to make it visually dynamic
  const getStepColorClass = (step: number) => {
    switch (step) {
      case 1: return 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20 ring-indigo-950/10';
      case 2: return 'text-sky-400 bg-sky-950/40 border-sky-500/20 ring-sky-950/10';
      case 3: return 'text-purple-400 bg-purple-950/40 border-purple-500/20 ring-purple-950/10';
      case 4: return 'text-amber-400 bg-amber-950/40 border-amber-500/20 ring-amber-950/10';
      case 5: return 'text-pink-400 bg-pink-950/40 border-pink-500/20 ring-pink-950/10';
      case 6: return 'text-teal-400 bg-teal-950/40 border-teal-500/20 ring-teal-950/10';
      case 7: return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20 ring-emerald-950/10';
      default: return 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20 ring-indigo-950/10';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-sileo-fade">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        
        {/* Skip button top-right (always visible) */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-slate-800/40 z-10"
          title="Saltar tutorial"
        >
          <span>Saltar</span>
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Progress header */}
        <div className="flex flex-col mb-6">
          <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase mb-2">
            Paso {currentStep} de 7
          </span>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Tour Step Content Container (Uses React key to trigger entry animation on step change) */}
        <div key={currentStep} className="animate-sileo-pop flex flex-col items-center text-center flex-1">
          {/* Glowing active icon */}
          <div className={`flex h-16 w-16 items-center justify-center rounded-full border ring-8 mb-6 animate-bounce-subtle ${getStepColorClass(currentStep)}`}>
            {currentStepData.icon}
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
            {currentStepData.title}
          </h3>

          <div className="mb-8 min-h-[5.5rem] flex items-center justify-center w-full">
            {currentStepData.description}
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-800/60">
          {/* Back button */}
          {currentStep > 1 ? (
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Anterior</span>
            </button>
          ) : (
            <button
              onClick={handleSkip}
              className="text-xs font-semibold text-slate-400 hover:text-white px-4 py-2 transition-all"
            >
              Saltar tour
            </button>
          )}

          {/* Forward / CTA button */}
          {currentStep < 7 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-5 py-2 text-xs font-semibold text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] active:scale-[0.98]"
            >
              <span>{currentStep === 1 ? 'Empezar tour' : 'Siguiente'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-2.5 text-xs font-bold text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-[0.98]"
            >
              <span>Ir a mis repositorios</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center space-x-2 mt-6">
          {[...Array(7)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i + 1)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentStep === i + 1 ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-700 hover:bg-slate-600'
              }`}
              aria-label={`Ir al paso ${i + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
