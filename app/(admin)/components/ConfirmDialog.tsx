"use client";

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useBodyScrollLock } from './useBodyScrollLock';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmText: string;
  cancelText: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  cancelText,
  isDanger = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <button
        type="button"
        aria-label={cancelText}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-gray-600 break-words">{description}</p>
          ) : null}
        </div>
        <div className="p-5 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
