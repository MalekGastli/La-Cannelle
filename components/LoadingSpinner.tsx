"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
  size?: number;
};

export default function LoadingSpinner({ label = 'Loading...', className = '', size = 18 }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`} aria-live="polite" aria-busy="true">
      <div className="inline-flex items-center gap-3 rounded-full bg-white/80 backdrop-blur-sm border border-amber-200 shadow-sm px-4 py-2 text-gray-700">
        <span className="shrink-0 w-9 h-9 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
          <Loader2
            className="animate-spin text-amber-700"
            style={{ width: size, height: size }}
            aria-hidden="true"
          />
        </span>
        {label ? <span className="text-sm font-medium">{label}</span> : null}
      </div>
    </div>
  );
}
