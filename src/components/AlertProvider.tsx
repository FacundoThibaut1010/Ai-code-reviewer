'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { Toaster, sileo } from 'sileo';
import 'sileo/styles.css';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertOptions {
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const showAlert = (options: AlertOptions) => {
    const { type, title, message, onConfirm, confirmText } = options;

    // Custom ReactNode description if confirmation is required
    const description = onConfirm ? (
      <div className="flex flex-col gap-3 mt-1.5 text-left w-full">
        <p className="text-xs text-black font-semibold leading-relaxed">{message}</p>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              onConfirm();
              sileo.clear();
            }}
            className="rounded bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 text-[11px] transition-colors shadow-sm active:scale-[0.98]"
          >
            {confirmText || 'Confirmar'}
          </button>
          <button
            onClick={() => {
              sileo.clear();
            }}
            className="rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-1.5 text-[11px] border border-slate-700 transition-colors active:scale-[0.98]"
          >
            Cancelar
          </button>
        </div>
      </div>
    ) : message;

    // Sileo Toast options
    const toastConfig = {
      title,
      description,
      duration: onConfirm ? null : 1500, // Disappear faster (1.5 seconds) if not a confirmation alert
      styles: {
        description: 'text-black font-semibold', // High contrast black text
      }
    };

    switch (type) {
      case 'success':
        sileo.success(toastConfig);
        break;
      case 'error':
        sileo.error(toastConfig);
        break;
      case 'warning':
        sileo.warning(toastConfig);
        break;
      case 'info':
        sileo.info(toastConfig);
        break;
    }
  };

  const hideAlert = () => {
    sileo.clear();
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Toaster theme="dark" position="top-center" />
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
