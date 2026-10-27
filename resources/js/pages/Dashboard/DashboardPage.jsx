import { useEffect, useState } from 'react';
import { AlertTriangle, DollarSign, Loader, Package, TrendingUp } from 'lucide-react';
import { StatCard } from '../../components/common/Card';
import { fetchDashboardData } from '../../services/dashboardService';
import { formatCurrency } from '../../lib/formatters';

const saleStatusLabels = {
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  pending: 'Menunggu',
  processing: 'Diproses',
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const { stats: nextStats, recentSales: nextSales } = await fetchDashboardData(token);
        setStats(nextStats);
        setRecentSales(nextSales);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [token]);

  if (loading) {
    return (
      <div role="status" aria-label="Memuat dasbor" className="flex min-h-[50vh] items-center justify-center rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">
        <Loader className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Ringkasan</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Dasbor</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Ringkasan kinerja toko dan transaksi terbaru.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Sinkronisasi terakhir: baru saja
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Omzet Hari Ini" value={formatCurrency(stats.todayRevenue)} icon={DollarSign} color="green" />
          <StatCard title="Omzet Bulan Ini" value={formatCurrency(stats.monthRevenue)} icon={TrendingUp} color="blue" />
          <StatCard title="Total Produk" value={stats.totalProducts} icon={Package} color="yellow" />
          <StatCard title="Stok Menipis" value={stats.lowStockProducts} icon={AlertTriangle} color="red" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Object.entries(stats.priceTypeStats || {}).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{key.replace(/_/g, ' ')}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(value.omzet)}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{value.salesCount || 0} transaksi</p>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Transaksi Terbaru</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Aktivitas penjualan terkini.</p>
            </div>
            <button type="button" className="min-h-10 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900">
              Lihat semua
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="app-table min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="sticky top-0 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">ID</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">Pelanggan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">Tanggal</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">Kasir</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">Jumlah</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                {recentSales.length > 0 ? (
                  recentSales.map((sale) => (
                    <tr key={sale.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">#{sale.id}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{sale.customer_name || 'Pelanggan umum'}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{new Date(sale.created_at).toLocaleString('id-ID')}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{sale.user_name || '-'}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(sale.total_amount)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sale.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : sale.status === 'cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>
                            {saleStatusLabels[sale.status] || 'Status tidak diketahui'}
                          </span>
                          {sale.blockchain_hash ? (
                            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                              Tersimpan permanen ✓
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 dark:border-slate-700 dark:bg-slate-900">
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Belum ada transaksi</p>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Transaksi penjualan terbaru akan tampil di sini.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
