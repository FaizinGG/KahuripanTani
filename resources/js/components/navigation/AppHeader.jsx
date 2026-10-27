import { Menu, Moon, Sun } from 'lucide-react';

export default function AppHeader({ user, onMenuClick, theme, onToggleTheme, onLogout }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            aria-label="Buka navigasi"
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Selamat datang kembali</p>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{user?.name || 'Pengguna'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Mode terang' : 'Mode gelap'}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-2xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
