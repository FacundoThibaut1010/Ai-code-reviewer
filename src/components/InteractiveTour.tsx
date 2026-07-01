'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { sileo } from 'sileo';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface TourStepConfig {
  element: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: Record<number, TourStepConfig> = {
  1: {
    element: '#tour-first-repo',
    title: 'Dashboard',
    description: 'Tocá cualquier repositorio para empezar',
    position: 'bottom'
  },
  2: {
    element: '#tour-project-tab-btn',
    title: 'Opciones del repositorio',
    description: "Hacé click en 'Analizar Proyecto Completo' para conocer esta sección.",
    position: 'bottom'
  },
  3: {
    element: '#tour-save-project-analysis-btn',
    title: 'Analizar Proyecto Completo',
    description: "Aquí la IA analiza el repositorio completo. Hacé click en 'Guardar Análisis' para guardarlo.",
    position: 'bottom'
  },
  4: {
    element: '#tour-prs-tab-btn',
    title: 'Volver a Pull Requests',
    description: "Ahora hacé click en 'Analizar un Pull Request' para continuar al listado de PRs.",
    position: 'bottom'
  },
  5: {
    element: '#tour-pr-list',
    title: 'Elegir un Pull Request',
    description: 'Seleccioná un Pull Request para ver el código y analizarlo con IA',
    position: 'top'
  },
  6: {
    element: '#tour-analyze-btn',
    title: 'Detalle del Pull Request',
    description: 'Tocá este botón para que la IA analice el código en tiempo real',
    position: 'left'
  },
  7: {
    element: '#tour-analysis-stream',
    title: 'Generando el análisis',
    description: 'La IA está analizando tu código en tiempo real. Esperá a que termine.',
    position: 'top'
  },
  8: {
    element: '#tour-save-review-btn',
    title: 'Guardar el review',
    description: 'Guardá el review para consultarlo después en tu historial',
    position: 'left'
  }
};

export default function InteractiveTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  // Initialize and check status
  useEffect(() => {
    setMounted(true);
    const completed = localStorage.getItem('tutorial_completed');
    if (completed !== 'true') {
      const savedStep = localStorage.getItem('interactive_tour_step');
      if (savedStep) {
        setCurrentStep(Number(savedStep));
      } else {
        setCurrentStep(0);
      }
      setIsOpen(true);
    }
  }, []);

  // Cleanup driver on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, []);

  const skipTour = useCallback(() => {
    localStorage.setItem('tutorial_completed', 'true');
    setIsOpen(false);
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
  }, []);

  const finishTour = useCallback(() => {
    localStorage.setItem('tutorial_completed', 'true');
    setIsOpen(false);
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
    sileo.success({
      title: 'Tutorial completado — ¡a codear! 🚀',
      duration: 2500
    });
    router.push('/history');
  }, [router]);

  // Main driver step-by-step logic
  useEffect(() => {
    if (!mounted || !isOpen || currentStep === 0 || currentStep >= 9) {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
      return;
    }

    // Ignore landing page / callback page
    if (pathname === '/' || pathname === '/auth/callback') {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
      return;
    }

    let active = true;
    let intervalId: NodeJS.Timeout;

    const config = TOUR_STEPS[currentStep];
    if (!config) return;

    const tryInitDriver = () => {
      const el = document.querySelector(config.element);
      if (el && active) {
        // Destroy previous driver before re-building
        if (driverRef.current) {
          driverRef.current.destroy();
        }

        const d = driver({
          popoverClass: 'tour-popover-theme',
          overlayColor: 'rgba(2, 6, 23, 0.45)',
          stagePadding: 12, // Larger stage padding for larger highlight cutout
          allowClose: false, // force interactive progression
          onPopoverRender: (popover) => {
            // Inyectar indicador de progreso
            const progressEl = popover.wrapper.querySelector('.tour-progress') as HTMLElement | null;
            if (progressEl) {
              progressEl.textContent = `${currentStep} / 8`;
            } else {
              const newProgress = document.createElement('div');
              newProgress.className = 'tour-progress text-[10px] font-bold text-indigo-400 tracking-wider uppercase mb-2';
              newProgress.textContent = `${currentStep} / 8`;
              popover.wrapper.insertBefore(newProgress, popover.wrapper.firstChild);
            }

            // Inyectar botón "Saltar" en el tooltip
            const skipEl = popover.wrapper.querySelector('.tour-skip-btn') as HTMLElement | null;
            if (!skipEl) {
              const newSkip = document.createElement('button');
              newSkip.className = 'tour-skip-btn absolute top-3 right-3 text-[10px] font-bold text-slate-400 hover:text-white transition-all py-0.5 px-2 rounded bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50';
              newSkip.textContent = 'Saltar';
              newSkip.addEventListener('click', () => {
                skipTour();
              });
              popover.wrapper.appendChild(newSkip);
            }
          }
        });

        d.highlight({
          element: config.element,
          popover: {
            title: config.title,
            description: config.description,
            side: config.position,
            align: 'start'
          }
        });

        driverRef.current = d;
      } else {
        // Retry searching the DOM element every 200ms
        intervalId = setInterval(() => {
          if (!active) return;
          const retryEl = document.querySelector(config.element);
          if (retryEl) {
            clearInterval(intervalId);
            tryInitDriver();
          }
        }, 200);
      }
    };

    tryInitDriver();

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentStep, pathname, isOpen, mounted, skipTour]);

  // Click detectors for progression
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (currentStep === 1) {
        if (target.closest('#tour-first-repo') || target.closest('#tour-repo-list > div')) {
          advanceStep(2);
        }
      } else if (currentStep === 2) {
        // Must click "Analizar Proyecto Completo" tab button to advance to step 3
        if (target.closest('#tour-project-tab-btn')) {
          advanceStep(3);
        }
      } else if (currentStep === 4) {
        // Must click "Analizar un Pull Request" tab button to advance to step 5
        if (target.closest('#tour-prs-tab-btn')) {
          advanceStep(5);
        }
      } else if (currentStep === 5) {
        if (target.closest('#tour-pr-list') || target.closest('[onClick*="pulls"]') || target.closest('.group.cursor-pointer')) {
          advanceStep(6);
        }
      } else if (currentStep === 6) {
        if (target.closest('#tour-analyze-btn')) {
          advanceStep(7);
        }
      } else if (currentStep === 8) {
        if (target.closest('#tour-save-review-btn')) {
          // Delay to let database operation trigger before showing final modal
          setTimeout(() => {
            advanceStep(9);
          }, 800);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [currentStep, isOpen]);

  // Step 3 automatic progress if already saved or once clicked & disabled
  useEffect(() => {
    if (!isOpen || currentStep !== 3) return;

    const checkAlreadySaved = () => {
      const btn = document.querySelector('#tour-save-project-analysis-btn') as HTMLButtonElement | null;
      // Advance ONLY if the text says "Guardado" (successfully saved) and NOT during loading "Guardando..."
      if (btn && btn.textContent?.includes('Guardado') && !btn.textContent?.includes('Guardando')) {
        // Wait a small moment to let the success UI register, then advance to step 4
        setTimeout(() => {
          advanceStep(4);
        }, 1000);
      }
    };

    checkAlreadySaved();
    const interval = setInterval(checkAlreadySaved, 400);
    return () => clearInterval(interval);
  }, [currentStep, isOpen]);

  // Step 7 progress listener (wait for analysis finished event to go to step 8)
  useEffect(() => {
    if (!isOpen || currentStep !== 7) return;

    const handleAnalysisFinished = () => {
      advanceStep(8);
    };

    window.addEventListener('tour-analysis-finished', handleAnalysisFinished);
    return () => {
      window.removeEventListener('tour-analysis-finished', handleAnalysisFinished);
    };
  }, [currentStep, isOpen]);

  const advanceStep = (next: number) => {
    localStorage.setItem('interactive_tour_step', String(next));
    setCurrentStep(next);
  };

  if (!mounted || !isOpen) {
    return null;
  }

  // Render centered confirmation modal to start the tour (Step 0)
  if (currentStep === 0) {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }

    return (
      <div className="fixed inset-0 z-[100003] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-sileo-fade">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col text-slate-100 items-center text-center animate-tour-pop border-indigo-500/20">
          
          <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
            Tutorial de bienvenida
          </h3>

          <p className="text-slate-300 text-sm leading-relaxed mb-8">
            ¿Deseás iniciar el tour interactivo para aprender a usar la plataforma paso a paso?
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={skipTour}
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-all"
            >
              Saltar tutorial
            </button>
            <button
              onClick={() => advanceStep(1)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] active:scale-[0.98]"
            >
              <span>Iniciar tour</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render centered congratulation modal for Step 9 (Final)
  if (currentStep === 9) {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }

    return (
      <div className="fixed inset-0 z-[100003] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-sileo-fade">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col text-slate-100 items-center text-center animate-tour-pop border-emerald-500/20">
          
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 ring-8 ring-emerald-950/10 mb-6 border-emerald-900/30">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
            Tutorial completado
          </h3>

          <p className="text-slate-300 text-sm leading-relaxed mb-8">
            Ya sabés usar AI Code Reviewer. Podés ver todos tus reviews guardados en el Historial.
          </p>

          <button
            onClick={finishTour}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-3 text-xs font-bold text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-[0.98]"
          >
            <span>Ver mi historial</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
