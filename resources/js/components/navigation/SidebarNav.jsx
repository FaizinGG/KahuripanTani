import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, LogOut, X } from 'lucide-react';

const normalizeRoleName = (role) => {
  const value = typeof role === 'string' ? role : role?.name || role?.slug || '';
  const normalized = value.toString().trim().toLowerCase();

  if (['employee', 'kasir', 'cashier'].includes(normalized)) return 'kasir';
  if (['gudang', 'warehouse', 'stock'].includes(normalized)) return 'gudang';
  if (['owner', 'superadmin'].includes(normalized)) return 'owner';
  if (['admin', 'administrator'].includes(normalized)) return 'admin';

  return normalized;
};

const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'owner':
      return 'border border-rose-400/30 bg-rose-500/15 text-rose-200';
    case 'admin':
      return 'border border-sky-400/30 bg-sky-500/15 text-sky-200';
    case 'kasir':
      return 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-200';
    case 'gudang':
      return 'border border-amber-400/30 bg-amber-500/15 text-amber-200';
    default:
      return 'border border-slate-400/30 bg-slate-500/15 text-slate-200';
  }
};

const getRoleLabel = (role) => {
  switch (role) {
    case 'owner':
      return 'Pemilik';
    case 'admin':
      return 'ADMIN';
    case 'kasir':
      return 'KASIR';
    case 'gudang':
      return 'GUDANG';
    default:
      return 'ANGGOTA';
  }
};

export default function SidebarNav({ menuSections, user, onClose, handleLogout, openSection, onToggleSection }) {
  const location = useLocation();
  const primaryRole = normalizeRoleName(user?.roles?.[0] || user?.role || '');
  const roleBadgeClass = getRoleBadgeClass(primaryRole);
  const roleLabel = getRoleLabel(primaryRole);

  const isActiveLink = (path, search = '') => {
    if (search) {
      return location.pathname === path && location.search === search;
    }

    return location.pathname === path;
  };

  const isParentActive = (item) => {
    if (!item.children?.length) {
      return isActiveLink(item.path);
    }

    return item.children.some((child) => isActiveLink(child.path, child.search)) || isActiveLink(item.path);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-2 pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-400">Kahuripan Tani</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Area Kerja</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl border border-white/10 bg-slate-800/90 p-2 text-slate-300 transition hover:bg-slate-700 lg:hidden"
          aria-label="Tutup navigasi"
        >
          <X size={18} />
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.22)]">
        <p className="text-sm text-slate-400">Masuk sebagai</p>
        <p className="mt-2 text-lg font-semibold text-white">{user?.name || 'Pengguna'}</p>
        <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${roleBadgeClass}`}>
          {roleLabel}
        </span>
      </div>

      <nav className="mt-8 px-2">
        {menuSections.map((section) => (
          <div key={section.title} className="mt-6 first:mt-0">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">{section.title}</p>
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const isExpanded = openSection === item.sectionKey;
                const isActiveParent = isParentActive(item);

                if (item.children?.length) {
                  return (
                    <div key={item.label} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => onToggleSection(item.sectionKey)}
                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          isActiveParent
                            ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <item.icon size={18} className="shrink-0" />
                          <span>{item.label}</span>
                        </span>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

                      {isExpanded && (
                        <div className="ml-7 space-y-1 border-l border-white/10 pl-3 pb-1">
                          {item.children.map((child) => {
                            const childActive = isActiveLink(child.path, child.search);

                            return (
                              <NavLink
                                key={child.label}
                                to={{ pathname: child.path, search: child.search || '' }}
                                onClick={onClose}
                                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-200 ${
                                  childActive
                                    ? 'bg-sky-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <span className={`h-2.5 w-2.5 rounded-full ${childActive ? 'bg-sky-200' : 'bg-transparent'}`} />
                                <span>{child.label}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={18} className="shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto px-2 pt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>
    </div>
  );
}
