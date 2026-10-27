import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  Tags,
  Boxes,
  Truck,
  LogOut,
  Menu,
  X,
  FileText,
  Settings,
  Moon,
  Sun,
  Trash2,
  User,
} from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const MenuLink = ({ icon: Icon, label, path, requiredRoles }) => {
    if (requiredRoles && !requiredRoles.includes(user?.roles?.[0]?.name)) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={() => {
          navigate(path);
          setSidebarOpen(false);
        }}
        className={`w-full text-left rounded-3xl px-5 py-3 transition ${
          isActive(path)
            ? 'bg-sky-500/10 text-sky-700 shadow-sm ring-1 ring-sky-500/20'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} />
          <span>{label}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="relative flex">
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-72 overflow-y-auto bg-slate-950 px-4 pb-8 pt-6 shadow-xl transition duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-2 pb-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-400">Kahuripan Tani</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Dasbor</h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-2xl border border-white/10 bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-800/90 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
            <p className="text-sm text-slate-400">Masuk sebagai</p>
            <p className="mt-2 text-lg font-semibold text-white">{user?.name || 'Pengguna'}</p>
            <span className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              {user?.roles?.[0]?.display_name || 'Anggota'}
            </span>
          </div>

          <nav className="mt-8 space-y-4 px-2">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Utama</div>
            <MenuLink icon={BarChart3} label="Dasbor" path="/" />
            <MenuLink icon={ShoppingCart} label="POS (Kasir)" path="/pos" />

            <div className="pt-6 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Persediaan</div>
            <MenuLink icon={Package} label="Produk" path="/products" requiredRoles={['owner', 'admin']} />
            <MenuLink icon={Tags} label="Kategori" path="/categories" requiredRoles={['owner', 'admin']} />
            <MenuLink icon={Truck} label="Pemasok" path="/suppliers" requiredRoles={['owner', 'admin']} />
            <MenuLink icon={Boxes} label="Stok" path="/stocks" requiredRoles={['owner', 'admin']} />
            <MenuLink icon={Trash2} label="Pembersihan Data" path="/management/cleanup" requiredRoles={['owner', 'admin']} />

            <div className="pt-6 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Manajemen</div>
            <MenuLink icon={Users} label="Pelanggan" path="/customers" requiredRoles={['owner', 'admin']} />

            <div className="pt-6 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Administrasi</div>
            <MenuLink icon={User} label="Profil" path="/profile" />

            <div className="pt-6 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Laporan dan Administrasi</div>
            <MenuLink icon={FileText} label="Laporan" path="/reports" requiredRoles={['owner', 'admin']} />
            <MenuLink icon={Settings} label="Pengaturan" path="/admin" requiredRoles={['owner', 'admin']} />
          </nav>

          <div className="mt-8 px-2">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-3xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-400"
            >
              <LogOut size={18} />
              Keluar
            </button>
          </div>
        </aside>

        <div className="flex-1 lg:pl-72">
          <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 lg:hidden"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <p className="text-sm text-slate-500">Selamat datang kembali</p>
                  <h1 className="text-lg font-semibold text-slate-900">{user?.name || 'Pengguna'}</h1>
                </div>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <button onClick={toggleTheme} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  {theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
                </button>
                <button className="rounded-2xl border border-slate-200/80 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">Ringkasan</button>
                <button onClick={handleLogout} className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400">
                  Keluar
                </button>
              </div>
            </div>
          </div>

          <main className="min-h-[calc(100vh-80px)] bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
