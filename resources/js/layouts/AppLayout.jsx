import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart3, ShoppingCart, Package, Wallet, LayoutDashboard, Users, FileText, Trash2, User } from 'lucide-react';
import SidebarNav from '../components/navigation/SidebarNav';
import AppHeader from '../components/navigation/AppHeader';

const normalizeRoleName = (role) => {
  const value = typeof role === 'string' ? role : role?.name || role?.slug || '';
  const normalized = value.toString().trim().toLowerCase();

  if (['employee', 'kasir', 'cashier'].includes(normalized)) return 'kasir';
  if (['gudang', 'warehouse', 'stock'].includes(normalized)) return 'gudang';
  if (['owner', 'superadmin'].includes(normalized)) return 'owner';
  if (['admin', 'administrator'].includes(normalized)) return 'admin';

  return normalized;
};

const getRoleNames = (user) => (user?.roles || []).map((role) => normalizeRoleName(role));

const hasAccess = (requiredRoles, roleNames) => {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  return roleNames.some((role) => requiredRoles.includes(role));
};

const menuSections = [
  {
    title: 'OPERASIONAL',
    items: [
      { label: 'Dasbor', path: '/dashboard', icon: LayoutDashboard, requiredRoles: ['owner', 'admin', 'kasir', 'gudang'] },
      { label: 'POS (Kasir)', path: '/pos', icon: ShoppingCart, requiredRoles: ['owner', 'admin', 'kasir'] },
      { label: 'Keanggotaan', path: '/memberships', icon: Users, requiredRoles: ['owner', 'admin', 'kasir'] },
      { label: 'Persediaan', path: '/inventory', icon: Package, requiredRoles: ['owner', 'admin', 'gudang'] },
      { label: 'Piutang', path: '/management/receivables', icon: Wallet, requiredRoles: ['owner', 'admin', 'kasir'] },
    ],
  },
  {
    title: 'ADMINISTRASI',
    items: [
      { label: 'Profil', path: '/profile', icon: User },
      {
        label: 'Laporan',
        path: '/reports',
        icon: FileText,
        requiredRoles: ['owner', 'admin'],
        sectionKey: 'reports',
        children: [
          { label: 'Ringkasan Laporan', path: '/reports', search: '?view=overview' },
          { label: 'Laporan Penjualan', path: '/reports', search: '?view=sales' },
          { label: 'Laporan Keuntungan', path: '/reports', search: '?view=profit' },
          { label: 'Laporan Stok', path: '/reports', search: '?view=stock' },
          { label: 'Laporan Piutang', path: '/reports', search: '?view=receivables' },
          { label: 'Ekspor Excel', path: '/reports', search: '?view=export-excel' },
          { label: 'Ekspor PDF', path: '/reports', search: '?view=export-pdf' },
        ],
      },
      {
        label: 'Manajemen',
        path: '/management',
        icon: Users,
        requiredRoles: ['owner', 'admin'],
        sectionKey: 'management',
        children: [
          { label: 'Data Karyawan', path: '/management', search: '?view=employees' },
          { label: 'Tambah Karyawan', path: '/management', search: '?view=add-employee' },
          { label: 'Absensi', path: '/management', search: '?view=attendance' },
          { label: 'Riwayat Login', path: '/management', search: '?view=history' },
          { label: 'Hak Akses', path: '/management', search: '?view=access' },
          { label: 'Log Aktivitas', path: '/management', search: '?view=activity' },
          { label: 'Pembersihan Data', path: '/management', search: '?view=cleanup' },
          { label: 'Pengaturan QRIS', path: '/management', search: '?view=qris' },
        ],
      },
    ],
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const roleNames = getRoleNames(user);
  const visibleMenuSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasAccess(item.requiredRoles, roleNames)),
    }))
    .filter((section) => section.items.length > 0);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/reports') {
      setOpenSection('reports');
    } else if (location.pathname === '/management' || location.pathname === '/admin') {
      setOpenSection('management');
    } else {
      setOpenSection(null);
    }
  }, [location.pathname]);

  const toggleSection = (sectionKey) => {
    setOpenSection((prev) => (prev === sectionKey ? null : sectionKey));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="relative flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 shrink-0 overflow-y-auto border-r border-slate-800/60 bg-slate-950 px-4 py-6 shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:fixed lg:w-72 lg:translate-x-0`}
        >
          <SidebarNav
            menuSections={visibleMenuSections}
            user={user}
            onClose={() => setSidebarOpen(false)}
            handleLogout={handleLogout}
            openSection={openSection}
            onToggleSection={toggleSection}
          />
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup navigasi"
          />
        )}

        <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
          <AppHeader
            user={user}
            onMenuClick={() => setSidebarOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
          />

          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-2 py-2 sm:px-4 lg:px-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
