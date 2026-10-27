import { X, Check, AlertCircle, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Toast({ message, type = 'success', onClose, autoClose = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!isVisible) return null;

  const typeConfig = {
    success: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', icon: Check, text: 'text-emerald-800 dark:text-emerald-200' },
    error: { bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/30', icon: AlertCircle, text: 'text-rose-800 dark:text-rose-200' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30', icon: AlertCircle, text: 'text-amber-800 dark:text-amber-200' },
    info: { bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-200 dark:border-sky-500/30', icon: Info, text: 'text-sky-800 dark:text-sky-200' },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`${config.bg} border ${config.border} flex max-w-md items-start gap-3 rounded-lg p-4`}>
      <Icon className={`h-5 w-5 ${config.text} flex-shrink-0`} />
      <p className={`${config.text} text-sm font-medium flex-1`}>{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        type="button"
        aria-label="Tutup notifikasi"
        className={`${config.text} rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10`}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
