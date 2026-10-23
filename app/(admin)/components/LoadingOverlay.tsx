"use client";

import React, { useEffect, useState } from 'react';
import { useBodyScrollLock } from './useBodyScrollLock';
import LoadingSpinner from '@/components/LoadingSpinner';

type LoadingOverlayProps = {
  open: boolean;
  label?: string;
  minDurationMs?: number;
};

export default function LoadingOverlay({ open, label = 'Loading...', minDurationMs = 500 }: LoadingOverlayProps) {
  const [visible, setVisible] = useState(open);
  const [shownAt, setShownAt] = useState<number | null>(open ? Date.now() : null);

  useEffect(() => {
    if (open) {
      if (!visible) {
        setVisible(true);
      }
      if (shownAt === null) {
        setShownAt(Date.now());
      }
      return;
    }

    if (!visible) return;

    const startedAt = shownAt ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, minDurationMs - elapsed);

    if (remaining === 0) {
      setVisible(false);
      setShownAt(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
      setShownAt(null);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [open, visible, shownAt, minDurationMs]);

  useBodyScrollLock(visible);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative">
        <LoadingSpinner label={label} />
      </div>
    </div>
  );
}
