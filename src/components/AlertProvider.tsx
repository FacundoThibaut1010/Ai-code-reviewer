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
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const showAlert = (options: AlertOptions) => {
    const { type, title, message, onConfirm } = options;

    const button = onConfirm ? {
      title: 'Confirmar',
      onClick: onConfirm,
    } : undefined;

    // Sileo Toast options
    const toastConfig = {
      title,
      description: message,
      button,
      duration: onConfirm ? null : 4000, // Stay open if there is a confirmation button, otherwise auto-dismiss in 4s
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
