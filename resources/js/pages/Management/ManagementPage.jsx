import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import PasswordInput from '../../components/PasswordInput';
import CleanupPage from './CleanupPage';
import PaymentSettingsPage from '../Settings/PaymentSettingsPage';
import { Users, BriefcaseBusiness, CalendarClock, LogIn, ShieldCheck, Search, Plus, Pencil, Trash2, RotateCcw, Download } from 'lucide-react';

const roleLabels = {
  owner: 'Pemilik',
  admin: 'Admin',
  kasir: 'Kasir',
  gudang: 'Gudang',
  employee: 'Karyawan',
};

const statusStyles = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-rose-100 text-rose-700',
};

const roleStyles = {
  owner: 'bg-blue-100 text-blue-700',
  admin: 'bg-violet-100 text-violet-700',
  kasir: 'bg-orange-100 text-orange-700',
  gudang: 'bg-slate-200 text-slate-700',
  employee: 'bg-slate-200 text-slate-700',
};

export default function ManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [filters, setFilters] = useState({ search: '', role: '', status: '', position: '', joined_from: '', joined_to: '' });
  const [loading, setLoading] = useState(true);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState(new URLSearchParams(location.search).get('view') || 'employees');
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', password_confirmation: '', phone: '', address: '', position: '', role: 'kasir', status: 'active', joined_at: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, attendanceRes] = await Promise.all([
        axios.get('/api/management/stats'),
        axios.get('/api/management/users?per_page=15'),
        axios.get('/api/management/attendance?per_page=10'),
      ]);
      setStats(statsRes.data.stats);
      setUsers(statsRes.data.users || []);
      setAttendance(attendanceRes.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      setLoginHistoryLoading(true);
      const historyRes = await axios.get('/api/management/login-history', {
        params: { per_page: 10 },
      });
      setLoginHistory(historyRes.data.data || historyRes.data || []);
    } catch (error) {
      console.error(error);
      setLoginHistory([]);
    } finally {
      setLoginHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const currentView = new URLSearchParams(location.search).get('view') || 'employees';
    setActiveTab(currentView);
  }, [location.search]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchLoginHistory();
    }
  }, [activeTab]);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesSearch = !filters.search || [user.name, user.username, user.email, user.position].join(' ').toLowerCase().includes(filters.search.toLowerCase());
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatus = !filters.status || user.status === filters.status;
    const matchesPosition = !filters.position || (user.position || '').toLowerCase().includes(filters.position.toLowerCase());
    return matchesSearch && matchesRole && matchesStatus && matchesPosition;
  }), [users, filters]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    // Validasi password
    if (form.password !== form.password_confirmation) {
      setErrorMessage('Password tidak cocok');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post('/api/management/users', form);
      setSuccessMessage('Karyawan berhasil ditambahkan');
      setForm({ name: '', username: '', email: '', password: '', password_confirmation: '', phone: '', address: '', position: '', role: 'kasir', status: 'active', joined_at: '' });
      setTimeout(() => {
        setSuccessMessage('');
        fetchData();
      }, 1500);
    } catch (error) {
      // Handle Laravel validation errors
      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors || {};
        const errorMessages = Object.values(errors).flat().join(', ');
        setErrorMessage(errorMessages || 'Data tidak valid');
      } else {
        const message = error.response?.data?.message || error.message || 'Gagal menambahkan karyawan';
        setErrorMessage(message);
      }
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await axios.delete(`/api/management/users/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Manajemen</p>
            <h1 className="mt-2 text-3xl font-semibold">Modul Manajemen</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Kelola karyawan, absensi, akses, pembersihan data, dan pengaturan QRIS dari satu tempat.</p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">Ekspor Excel</button>
            <button className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">Ekspor PDF</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Pengguna', value: stats?.total_users ?? 0, icon: Users },
          { label: 'Pemilik', value: stats?.owner ?? 0, icon: ShieldCheck },
          { label: 'Admin', value: stats?.admin ?? 0, icon: ShieldCheck },
          { label: 'Hadir Hari Ini', value: stats?.present_today ?? 0, icon: CalendarClock },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
                </div>
                <div className="rounded-xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <nav aria-label="Navigasi Manajemen" className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          {[
            { key: 'employees', label: 'Data Karyawan' },
            { key: 'add-employee', label: 'Tambah Karyawan' },
            { key: 'attendance', label: 'Absensi' },
            { key: 'history', label: 'Riwayat Login' },
            { key: 'access', label: 'Hak Akses' },
            { key: 'activity', label: 'Log Aktivitas' },
            { key: 'cleanup', label: 'Pembersihan Data' },
            { key: 'qris', label: 'Pengaturan QRIS' },
          ].map((tab) => (
            <button key={tab.key} type="button" onClick={() => navigate(`/management?view=${tab.key}`)} aria-current={activeTab === tab.key ? 'page' : undefined} className={`min-h-10 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${activeTab === tab.key ? 'border-sky-700 bg-sky-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900'}`}>
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'employees' && (
          <div className="mt-6 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-4 lg:grid-cols-5">
                <label className="text-sm text-slate-600 dark:text-slate-300">
                  Pencarian
                    <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                    <Search className="mr-2 h-4 w-4 text-slate-400" />
                    <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Nama / nama pengguna / email" className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100" />
                  </div>
                </label>
                <label className="text-sm text-slate-600 dark:text-slate-300">
                  Peran
                  <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                    <option value="">Semua</option>
                    <option value="owner">Pemilik</option>
                    <option value="admin">Admin</option>
                    <option value="kasir">Kasir</option>
                    <option value="gudang">Gudang</option>
                  </select>
                </label>
                <label className="text-sm text-slate-600 dark:text-slate-300">
                  Status
                  <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                    <option value="">Semua</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </label>
                <label className="text-sm text-slate-600 dark:text-slate-300">
                  Jabatan
                  <input value={filters.position} onChange={(e) => setFilters({ ...filters, position: e.target.value })} placeholder="Jabatan" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                </label>
                <div className="flex items-end">
                  <button className="w-full rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white">Terapkan</button>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tambah Karyawan</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Plus className="h-4 w-4" /> Khusus Pemilik dan Admin</div>
              </div>
              {errorMessage && (
                <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{errorMessage}</div>
              )}
              {successMessage && (
                <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">{successMessage}</div>
              )}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                />
                <PasswordInput
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                  placeholder="Konfirmasi Password"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Nomor HP" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Alamat" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Jabatan" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="kasir">Kasir</option>
                  <option value="gudang">Gudang</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Pemilik</option>
                </select>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
                <input value={form.joined_at} onChange={(e) => setForm({ ...form, joined_at: e.target.value })} type="date" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              </div>
              <div className="mt-4 flex justify-end">
                <button type="submit" disabled={submitting} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Menyimpan...' : 'Simpan Karyawan'}</button>
              </div>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="app-table min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold text-slate-600">Nama</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-600">Username</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-600">Email</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-600">Jabatan</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-600">Peran</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-600">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {loading ? <tr><td colSpan="7" className="px-3 py-6 text-center text-slate-500">Memuat...</td></tr> : filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{user.username || '-'}</td>
                      <td className="px-3 py-3 text-slate-600">{user.email}</td>
                      <td className="px-3 py-3 text-slate-600">{user.position || '-'}</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[user.role] || roleStyles.employee}`}>{roleLabels[user.role] || 'Karyawan'}</span></td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[user.status] || 'bg-slate-100 text-slate-700'}`}>{user.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button className="rounded-lg bg-slate-100 p-2 text-slate-700"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDeactivate(user.id)} className="rounded-lg bg-rose-50 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'add-employee' && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-semibold text-slate-900">Tambah Karyawan</h2>
            <p className="mt-2 text-sm text-slate-600">Form penambahan karyawan tetap tersedia untuk owner dan admin.</p>
            <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <PasswordInput
                name="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                required
              />
              <PasswordInput
                name="password_confirmation"
                value={form.password_confirmation}
                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                placeholder="Konfirmasi Password"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                required
              />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Nomor HP" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Alamat" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Jabatan" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="kasir">Kasir</option>
                <option value="gudang">Gudang</option>
                <option value="admin">Admin</option>
                  <option value="owner">Pemilik</option>
              </select>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
              <input value={form.joined_at} onChange={(e) => setForm({ ...form, joined_at: e.target.value })} type="date" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <div className="md:col-span-2 xl:col-span-3 flex justify-end">
                <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Simpan Karyawan</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                { label: 'Jumlah Karyawan', value: stats?.total_users ?? 0, icon: Users },
                { label: 'Hadir Hari Ini', value: stats?.present_today ?? 0, icon: CalendarClock },
                { label: 'Terlambat', value: stats?.late_today ?? 0, icon: BriefcaseBusiness },
              ].map((item) => {
                const Icon = item.icon;
                return <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{item.label}</span><Icon className="h-4 w-4 text-slate-400" /></div><p className="mt-3 text-2xl font-semibold text-slate-900">{item.value}</p></div>;
              })}
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="app-table min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50"><tr><th className="px-3 py-3 text-left font-semibold text-slate-600">Nama</th><th className="px-3 py-3 text-left font-semibold text-slate-600">Tanggal</th><th className="px-3 py-3 text-left font-semibold text-slate-600">Jam Masuk</th><th className="px-3 py-3 text-left font-semibold text-slate-600">Jam Pulang</th><th className="px-3 py-3 text-left font-semibold text-slate-600">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">{attendance.map((item) => <tr key={item.id} className="text-slate-700 dark:text-slate-200"><td className="px-3 py-3">{item.user?.name || '-'}</td><td className="px-3 py-3">{item.attendance_date}</td><td className="px-3 py-3">{item.check_in_time || '-'}</td><td className="px-3 py-3">{item.check_out_time || '-'}</td><td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{{ present: 'Hadir', late: 'Terlambat', absent: 'Tidak hadir', leave: 'Izin' }[String(item.status || '').toLowerCase()] || 'Status tidak diketahui'}</span></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <table className="app-table min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold text-slate-600">Nama</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Peran</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-600">Masuk</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-600">Keluar</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loginHistoryLoading ? (
                  <tr><td colSpan="5" className="px-3 py-6 text-center text-slate-500">Memuat riwayat login...</td></tr>
                ) : loginHistory.length === 0 ? (
                  <tr><td colSpan="5" className="px-3 py-6 text-center text-slate-500">Belum ada riwayat login. Silakan masuk/keluar untuk menghasilkan catatan.</td></tr>
                ) : (
                  loginHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-3">{item.user?.name || '-'}</td>
                      <td className="px-3 py-3">{item.user?.roles?.[0]?.name || item.user?.roles?.[0] || '-'}</td>
                      <td className="px-3 py-3">{item.created_at}</td>
                      <td className="px-3 py-3">-</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{{ login: 'Masuk', logout: 'Keluar' }[String(item.action || '').toLowerCase()] || 'Aktivitas'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Hak Akses</h2>
            <p className="mt-2 text-sm text-slate-600">Pengaturan hak akses dapat dikelola melalui modul manajemen pengguna yang sudah ada.</p>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Log Aktivitas</h2>
            <p className="mt-2 text-sm text-slate-600">Riwayat aktivitas sistem akan muncul di sini saat data tersedia.</p>
          </div>
        )}

        {activeTab === 'cleanup' && <div className="mt-6"><CleanupPage /></div>}

        {activeTab === 'qris' && <div className="mt-6"><PaymentSettingsPage /></div>}
      </div>
    </div>
  );
}
