"use client";

import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export default function Modal({
  open,
  title,
  closeLabel,
  onClose,
  children,
  actions,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 bg-black/40 backdrop-blur"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white/95 p-6 shadow-xl shadow-black/10 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            type="button"
            className="rounded-full border border-slate-200/70 px-3 py-1 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
            onClick={onClose}
          >
            {closeLabel}
          </button>
        </div>
        <div className="mt-4 space-y-4 text-sm text-slate-700 dark:text-slate-200">
          {children}
        </div>
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
