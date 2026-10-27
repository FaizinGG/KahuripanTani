import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { BarChart3, Boxes, CalendarClock, Download, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../lib/formatters';

const reportMenus = [
  { key: 'overview', label: 'Ringkasan Laporan' },
  { key: 'sales', label: 'Laporan Penjualan' },
  { key: 'profit', label: 'Laporan Keuntungan' },
  { key: 'stock', label: 'Laporan Stok' },
  { key: 'receivables', label: 'Laporan Piutang' },
  { key: 'export-excel', label: 'Ekspor Excel' },
  { key: 'export-pdf', label: 'Ekspor PDF' },
];

const paymentMethodLabels = {
  cash: 'Tunai',
  qris: 'QRIS',
  debt: 'Piutang',
  transfer: 'Transfer',
};

const paymentStatusLabels = {
  paid: 'LUNAS',
  partial: 'SEBAGIAN',
  pending: 'BELUM LUNAS',
  overdue: 'JATUH TEMPO',
};

const getPaymentDescription = (sale) => {
  const method = paymentMethodLabels[String(sale.payment_method || '').toLowerCase()] || 'Tidak diketahui';
  const status = paymentStatusLabels[String(sale.payment_status || '').toLowerCase()] || 'Status tidak diketahui';

  return `${method} - ${status}`;
};

export default function ReportsPage() {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = new URLSearchParams(location.search).get('view') || 'overview';
  const [sales, setSales] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const [salesResponse, receivablesResponse] = await Promise.all([
          axios.get('/api/sales?per_page=100', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/receivables?per_page=100', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setSales(salesResponse.data.data || []);
        setReceivables(receivablesResponse.data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [token]);

  const metrics = useMemo(() => {
    const totalSales = (sales || []).reduce((sum, sale) => sum + Number(sale.total || sale.total_amount || 0), 0);
    const totalProfit = (sales || []).reduce((sum, sale) => {
      const profit = (sale.items || []).reduce((itemSum, item) => itemSum + Number(item.profit || 0), 0);
      return sum + profit;
    }, 0);
    const totalItemsSold = (sales || []).reduce((sum, sale) => {
      const qty = (sale.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0);
      return sum + qty;
    }, 0);
    const totalReceivables = (receivables || []).reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0) - Number(item.paid_amount || 0)), 0);
    const todayTransactions = (sales || []).filter((sale) => {
      const createdAt = new Date(sale.created_at);
      const now = new Date();
      return createdAt.toDateString() === now.toDateString();
    }).length;

    return {
      totalSales,
      totalProfit,
      totalItemsSold,
      totalReceivables,
      todayTransactions,
    };
  }, [sales, receivables]);

  const exportToExcel = async () => {
    try {
      setExporting(true);
      
      // Escape CSV values
      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const headers = ['No.', 'Nomor Nota', 'Total', 'Pembayaran', 'Tanggal'];
      const rows = (sales || []).map((sale, idx) => [
        idx + 1,
        sale.invoice_number || '-',
        formatCurrency(sale.total || sale.total_amount),
        getPaymentDescription(sale),
        new Date(sale.created_at).toLocaleDateString('id-ID'),
      ]);

      const csvContent = [
        ['LAPORAN PENJUALAN'],
        ['Tanggal: ' + new Date().toLocaleDateString('id-ID')],
        [],
        headers.map(escapeCSV),
        ...rows.map(row => row.map(escapeCSV)),
        [],
        ['RINGKASAN'],
        ['Total Penjualan', formatCurrency(metrics.totalSales)],
        ['Total Keuntungan', formatCurrency(metrics.totalProfit)],
        ['Total Item Terjual', metrics.totalItemsSold],
        ['Transaksi Hari Ini', metrics.todayTransactions],
      ].map(row => row.join(',')).join('\n');

      // Add BOM untuk UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `Laporan_Penjualan_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Gagal mengekspor Excel:', error);
      alert('Gagal mengekspor Excel: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setExporting(true);
      
      let content = `
        <html>
          <head>
            <title>Laporan Penjualan</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; margin-bottom: 10px; }
              .date { text-align: center; margin-bottom: 20px; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th, td { border: 1px solid #333; padding: 8px; text-align: left; }
              th { background-color: #f0f0f0; font-weight: bold; }
              .summary { margin-top: 30px; }
              .summary-item { margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <h1>LAPORAN PENJUALAN</h1>
            <div class="date">Tanggal: ${new Date().toLocaleDateString('id-ID')}</div>
            
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nomor Nota</th>
                  <th>Total</th>
                  <th>Pembayaran</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      (sales || []).forEach((sale, idx) => {
        content += `
          <tr>
            <td>${idx + 1}</td>
            <td>${sale.invoice_number || '-'}</td>
            <td>${formatCurrency(sale.total || sale.total_amount)}</td>
            <td>${getPaymentDescription(sale)}</td>
            <td>${new Date(sale.created_at).toLocaleDateString('id-ID')}</td>
          </tr>
        `;
      });

      content += `
              </tbody>
            </table>

            <div class="summary">
              <h3>RINGKASAN</h3>
              <div class="summary-item">Total Penjualan: <strong>${formatCurrency(metrics.totalSales)}</strong></div>
              <div class="summary-item">Total Keuntungan: <strong>${formatCurrency(metrics.totalProfit)}</strong></div>
              <div class="summary-item">Total Item Terjual: <strong>${metrics.totalItemsSold}</strong></div>
              <div class="summary-item">Transaksi Hari Ini: <strong>${metrics.todayTransactions}</strong></div>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write(content);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error('Gagal mengekspor PDF:', error);
      alert('Gagal mengekspor PDF');
    } finally {
      setExporting(false);
    }
  };

  const renderContent = () => {
    if (activeView === 'sales') {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Laporan Penjualan</h3>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="app-table min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Nomor Nota</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                {(sales || []).slice(0, 8).map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{sale.invoice_number || '-'}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{formatCurrency(sale.total || sale.total_amount)}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${sale.payment_method === 'debt' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'}`}>
                        {paymentMethodLabels[String(sale.payment_method || '').toLowerCase()] || 'Tidak diketahui'}
                      </span>
                      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                        {paymentStatusLabels[String(sale.payment_status || '').toLowerCase()] || 'Status tidak diketahui'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeView === 'profit') {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Laporan Keuntungan</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">Total Keuntungan</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-900 dark:text-emerald-100">{formatCurrency(metrics.totalProfit)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-600 dark:text-slate-300">Transaksi</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{sales.length}</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeView === 'stock') {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Laporan Stok</h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Data stok tersedia melalui modul persediaan dan dapat dipantau dari halaman stok.</p>
        </div>
      );
    }

    if (activeView === 'receivables') {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Laporan Piutang</h3>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="app-table min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Pelanggan</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Jumlah</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                {(receivables || []).slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{item.customer?.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{formatCurrency(item.amount)}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{paymentStatusLabels[String(item.status || '').toLowerCase()] || 'BELUM LUNAS'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeView === 'export-excel' || activeView === 'export-pdf') {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{activeView === 'export-excel' ? 'Ekspor Excel' : 'Ekspor PDF'}</h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Data laporan dapat diekspor ke format yang dipilih.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button className="rounded-xl">
              <Download className="mr-2 h-4 w-4" />
              {activeView === 'export-excel' ? 'Unduh Excel' : 'Unduh PDF'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: 'Total Penjualan', value: formatCurrency(metrics.totalSales), icon: BarChart3 },
            { label: 'Omzet', value: formatCurrency(metrics.totalSales), icon: TrendingUp },
            { label: 'Keuntungan', value: formatCurrency(metrics.totalProfit), icon: Wallet },
            { label: 'Total Piutang', value: formatCurrency(metrics.totalReceivables), icon: Wallet },
            { label: 'Barang Terjual', value: metrics.totalItemsSold.toLocaleString('id-ID'), icon: Boxes },
            { label: 'Transaksi Hari Ini', value: metrics.todayTransactions.toString(), icon: CalendarClock },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ringkasan Terbaru</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Laporan merangkum transaksi penjualan dan piutang yang tersimpan di sistem.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Laporan</p>
            <h1 className="mt-2 text-3xl font-semibold">Ringkasan Laporan</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Pantau performa penjualan, profit, stok, dan piutang dari satu halaman.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={exportToExcel}
              disabled={exporting}
              variant="secondary" 
              className="rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="mr-2 h-4 w-4" /> {exporting ? 'Mengekspor...' : 'Ekspor Excel'}
            </Button>
            <Button 
              onClick={exportToPDF}
              disabled={exporting}
              variant="secondary" 
              className="rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="mr-2 h-4 w-4" /> {exporting ? 'Mengekspor...' : 'Ekspor PDF'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {reportMenus.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(`?view=${item.key}`)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${activeView === item.key ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? <div role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">Memuat data laporan...</div> : renderContent()}
    </div>
  );
}
