import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center rounded-xl border border-rose-200 bg-white p-8 shadow-sm dark:border-rose-500/30 dark:bg-slate-950">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">403 - Akses Ditolak</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Anda tidak memiliki izin untuk membuka halaman ini.</p>
      </div>
    </div>
  );
}
