'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  icon?: LucideIcon;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  icon: Icon,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-900/40 py-2.5 px-4 text-sm text-slate-300 shadow-sm focus:border-indigo-500/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 transition-all select-none text-left"
      >
        <div className="flex items-center space-x-2.5 truncate">
          {Icon && <Icon className="h-4 w-4 text-slate-500 shrink-0" />}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Options Panel */}
      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 w-full origin-top-right rounded-xl border border-slate-800 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200 max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors text-left ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-900/60 hover:text-white'
                }`}
              >
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
