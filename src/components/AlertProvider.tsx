'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertOptions {
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showAlert = (options: AlertOptions) => {
    setAlert(options);
    setIsOpen(true);
  };

  const hideAlert = () => {
    setIsOpen(false);
    // Delay setting alert to null to allow fade-out animation to complete
    setTimeout(() => {
      if (alert?.onConfirm) {
        alert.onConfirm();
      }
      setAlert(null);
    }, 200);
  };

  const getIcon = (type: AlertType) => {
    switch (type) {
      case 'success':
        return (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 mb-5 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
            <Check className="h-8 w-8 stroke-[3]" />
          </div>
        );
      case 'error':
        return (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/35 text-rose-400 mb-5 shadow-[0_0_25px_rgba(244,63,94,0.25)]">
            <X className="h-8 w-8 stroke-[3]" />
          </div>
        );
      case 'warning':
        return (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/35 text-amber-400 mb-5 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
            <AlertTriangle className="h-8 w-8 stroke-[2.5]" />
          </div>
        );
      case 'info':
        return (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/35 text-indigo-400 mb-5 shadow-[0_0_25px_rgba(99,102,241,0.25)]">
            <Info className="h-8 w-8 stroke-[2.5]" />
          </div>
        );
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {isOpen && alert && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-sileo-fade"
          onClick={hideAlert}
        >
          <div 
            className="relative w-full max-w-[320px] bg-slate-900/80 border border-slate-800/80 backdrop-blur-2xl rounded-3xl p-6 flex flex-col items-center text-center shadow-[0_25px_60px_rgba(0,0,0,0.8)] animate-sileo-pop"
            onClick={(e) => e.stopPropagation()}
          >
            {getIcon(alert.type)}
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
              {alert.title}
            </h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed px-1">
              {alert.message}
            </p>
            <button
              onClick={hideAlert}
              className="w-full py-3 px-6 rounded-2xl bg-white text-slate-950 font-extrabold text-sm tracking-wide transition-all hover:bg-slate-100 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] active:scale-[0.97]"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
