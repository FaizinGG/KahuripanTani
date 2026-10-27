import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-6">
        <div
          className="fixed inset-0 bg-slate-950/55 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        <div role="dialog" aria-modal="true" aria-label={title} className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:max-h-[calc(100dvh-3rem)]">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dialog"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>

          {footer && <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">{footer}</div>}
        </div>
    </div>
  );
}
