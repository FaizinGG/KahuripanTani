import { useEffect, useMemo, useState } from 'react';
import axios from '../../lib/axios';
import { AlertCircle, CheckCircle2, Clock3, DollarSign, Loader } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  partial: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  overdue: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

export default function ReceivablesPage() {
  const navigate = useNavigate();
  const { customerId, receivableId } = useParams();
  const token = localStorage.getItem('token');
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [itemPaymentTarget, setItemPaymentTarget] = useState(null);
  const [itemPaymentAmount, setItemPaymentAmount] = useState('');
  const [itemPaymentMethod, setItemPaymentMethod] = useState('cash');
  const [itemPaymentNote, setItemPaymentNote] = useState('');
  const [itemPaymentError, setItemPaymentError] = useState('');
  const [itemPaymentSubmitting, setItemPaymentSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadReceivables = async (params = {}) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/receivables', {
        params: { per_page: 100, ...params },
        headers: { Authorization: `Bearer ${token}` },
      });
      setReceivables(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data piutang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceivables({ search });
  }, [token, search]);

  const totals = useMemo(() => {
    return receivables.reduce(
      (acc, item) => {
        acc.balance += Math.max(0, (item.amount || 0) - (item.paid_amount || 0));
        acc.total += item.amount || 0;
        return acc;
      },
      { balance: 0, total: 0 }
    );
  }, [receivables]);

  const customerSummaries = useMemo(() => {
    const grouped = new Map();

    receivables.forEach((receivable) => {
      const customerId = receivable.customer_id || `unknown-${receivable.id}`;
      const current = grouped.get(customerId) || {
        customer: receivable.customer,
        receivables: [],
        total: 0,
        paid: 0,
        balance: 0,
      };

      current.receivables.push(receivable);
      current.total += Number(receivable.amount || 0);
      current.paid += Number(receivable.paid_amount || 0);
      current.balance += Math.max(0, Number(receivable.amount || 0) - Number(receivable.paid_amount || 0));
      grouped.set(customerId, current);
    });

    return Array.from(grouped.values())
      .map((summary) => ({
        ...summary,
        status: summary.balance <= 0
          ? 'LUNAS'
          : summary.paid > 0
            ? 'SEBAGIAN'
            : 'BELUM LUNAS',
      }))
      .sort((first, second) => (first.customer?.name || '').localeCompare(second.customer?.name || '', 'id'));
  }, [receivables]);

  const selectedCustomerReceivables = useMemo(() => {
    if (!selected?.customer_id) return [];

    return receivables.filter((item) => item.customer_id === selected.customer_id);
  }, [receivables, selected?.customer_id]);

  const selectedCustomerBalance = useMemo(() => {
    if (selected && selected.customer_active_balance !== undefined) {
      return Math.max(0, Number(selected.customer_active_balance || 0));
    }

    return selectedCustomerReceivables.reduce(
      (balance, item) => balance + Math.max(0, Number(item.amount || 0) - Number(item.paid_amount || 0)),
      0
    );
  }, [selectedCustomerReceivables]);

  const selectedCustomerPaid = useMemo(() => {
    return selectedCustomerReceivables.reduce((paid, item) => paid + Number(item.paid_amount || 0), 0);
  }, [selectedCustomerReceivables]);

  const formatDate = (value) => value
    ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '-';

  const getSaleItemTotal = (item) => Number(item.quantity || 0) * Number(item.final_price || item.selling_price || item.unit_price || 0);

  const getSaleItemPaid = (item, payments = selected?.payments || []) => payments
    .filter((payment) => Number(payment.sale_item_id) === Number(item.id))
    .reduce((amount, payment) => amount + Number(payment.amount || 0), 0);

  const getSaleItemPayments = (item, payments = selected?.payments || []) => payments
    .filter((payment) => Number(payment.sale_item_id) === Number(item.id));

  const getSaleItemBalance = (item) => Math.max(0, getSaleItemTotal(item) - getSaleItemPaid(item));

  const getSaleItemStatus = (item, payments = selected?.payments || []) => {
    const paid = getSaleItemPaid(item, payments);
    const total = getSaleItemTotal(item);
    if (paid >= total) return 'LUNAS';
    if (paid > 0) return 'SEBAGIAN';
    return 'BELUM LUNAS';
  };

  const getReceivableStatus = (receivable) => {
    const items = receivable.sale?.items || [];
    if (!items.length) {
      const paid = Number(receivable.paid_amount || 0);
      const total = Number(receivable.amount || 0);
      if (paid >= total) return 'LUNAS';
      if (paid > 0) return 'SEBAGIAN';
      return 'BELUM LUNAS';
    }

    const itemStatuses = items.map((item) => getSaleItemStatus(item, receivable.payments || []));
    if (itemStatuses.every((status) => status === 'LUNAS')) return 'LUNAS';
    if (itemStatuses.every((status) => status === 'BELUM LUNAS')) return 'BELUM LUNAS';
    return 'SEBAGIAN';
  };

  const getStatusStyle = (status) => {
    if (status === 'LUNAS') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
    if (status === 'SEBAGIAN') return 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  };

  const updateSelectedHistory = (receivable) => {
    setSelected(receivable);
    setPaymentHistory(receivable.payments || []);
  };

  const openCustomerDetail = (summary) => {
    const firstReceivable = summary.receivables[0];
    if (firstReceivable) navigate(`/management/receivables/customer/${firstReceivable.customer_id}`);
  };

  useEffect(() => {
    if (!customerId) {
      setSelected(null);
      setPaymentHistory([]);
      return;
    }

    const customerReceivables = receivables.filter((item) => String(item.customer_id) === String(customerId));
    const target = receivableId
      ? customerReceivables.find((item) => String(item.id) === String(receivableId))
      : customerReceivables[0];

    if (target) updateSelectedHistory(target);
  }, [customerId, receivableId, receivables]);

  const deleteReceivable = async (receivableId) => {
    setDeleting(true);
    try {
      await axios.delete(`/api/receivables/${receivableId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelected((prev) => (prev?.id === receivableId ? null : prev));
      await loadReceivables({ search });
      setDeleteTarget(null);
      navigate(customerId ? `/management/receivables/customer/${customerId}` : '/management/receivables');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus piutang');
    } finally {
      setDeleting(false);
    }
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    if (!selected) return;

    try {
      const response = await axios.post(`/api/receivables/${selected.id}/payments`, {
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        notes: paymentNote,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentAmount('');
      setPaymentMethod('cash');
      setPaymentNote('');
      setSelected(response.data.data || null);
      await loadReceivables({ search });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mencatat pembayaran');
    }
  };

  const openItemPaymentModal = (item) => {
    setItemPaymentTarget(item);
    setItemPaymentAmount('');
    setItemPaymentMethod('cash');
    setItemPaymentNote('');
    setItemPaymentError('');
  };

  const closeItemPaymentModal = () => {
    if (itemPaymentSubmitting) return;
    setItemPaymentTarget(null);
  };

  const submitItemPayment = async (event) => {
    event.preventDefault();
    if (!selected || !itemPaymentTarget) return;

    const amount = Number(itemPaymentAmount);
    const remaining = getSaleItemBalance(itemPaymentTarget);
    if (!Number.isFinite(amount) || amount <= 0) {
      setItemPaymentError('Nominal pembayaran harus lebih besar dari 0.');
      return;
    }
    if (amount > remaining) {
      setItemPaymentError('Nominal pembayaran tidak boleh melebihi sisa tagihan.');
      return;
    }

    setItemPaymentSubmitting(true);
    try {
      const response = await axios.post(`/api/receivables/${selected.id}/payments`, {
        amount,
        sale_item_id: itemPaymentTarget.id,
        payment_method: itemPaymentMethod,
        notes: itemPaymentNote || undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedReceivable = response.data.data || null;
      setSelected(updatedReceivable);
      setPaymentHistory(updatedReceivable?.payments || []);
      setItemPaymentTarget(null);
      setItemPaymentAmount('');
      await loadReceivables({ search });
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal mencatat pembayaran barang';
      setItemPaymentError(message);
      setError(message);
    } finally {
      setItemPaymentSubmitting(false);
    }
  };

  const renderNavigationDetail = () => {
    if (!selected) return null;

    const customerReceivables = receivables.filter((item) => String(item.customer_id) === String(customerId));
    const customerTotal = customerReceivables.reduce((total, item) => total + Number(item.amount || 0), 0);
    const customerPaid = customerReceivables.reduce((total, item) => total + Number(item.paid_amount || 0), 0);
    const customerBalance = customerReceivables.reduce((total, item) => total + Math.max(0, Number(item.amount || 0) - Number(item.paid_amount || 0)), 0);

    if (!receivableId) {
      const customerStatus = customerBalance <= 0 ? 'LUNAS' : customerPaid > 0 ? 'SEBAGIAN' : 'BELUM LUNAS';
      return (
        <div className="space-y-6">
          <button type="button" onClick={() => navigate('/management/receivables')} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"><span aria-hidden="true">&larr;</span> Kembali ke Daftar Piutang</button>
          <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Piutang</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Detail Piutang</h1>
            <div className="mt-6 grid gap-4 sm:grid-cols-2"><div><p className="text-sm text-slate-500">Nama</p><p className="mt-1 font-semibold">{selected.customer?.name || '-'}</p></div><div><p className="text-sm text-slate-500">Nomor HP</p><p className="mt-1 font-semibold">{selected.customer?.phone || '-'}</p></div><div><p className="text-sm text-slate-500">Alamat</p><p className="mt-1 font-semibold">{selected.customer?.address || '-'}</p></div><div><p className="text-sm text-slate-500">Status</p><span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(customerStatus)}`}>{customerStatus}</span></div></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Total Piutang</p><p className="mt-1 text-xl font-semibold">Rp {customerTotal.toLocaleString('id-ID')}</p></div><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Total Dibayar</p><p className="mt-1 text-xl font-semibold">Rp {customerPaid.toLocaleString('id-ID')}</p></div><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Total Sisa</p><p className="mt-1 text-xl font-semibold text-sky-700">Rp {customerBalance.toLocaleString('id-ID')}</p></div></div>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"><h2 className="text-lg font-semibold">Daftar Nota</h2><div className="mt-4 space-y-3">{customerReceivables.map((item) => { const balance = Math.max(0, Number(item.amount || 0) - Number(item.paid_amount || 0)); const status = getReceivableStatus(item); return <div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex flex-col gap-3 sm:flex-row sm:justify-between"><div><p className="font-semibold">{item.sale?.invoice_number || `Nota #${item.id}`}</p><p className="mt-1 text-sm text-slate-500">Tanggal: {formatDate(item.sale?.created_at || item.created_at)}</p><p className="mt-1 text-sm text-slate-500">Jatuh Tempo: {formatDate(item.due_date)}</p></div><div className="sm:text-right"><p className="text-sm text-slate-500">Total: Rp {Number(item.amount || 0).toLocaleString('id-ID')}</p><p className="text-sm text-slate-500">Dibayar: Rp {Number(item.paid_amount || 0).toLocaleString('id-ID')}</p><p className="font-semibold">Sisa: Rp {balance.toLocaleString('id-ID')}</p><span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusStyle(status)}`}>{status}</span></div></div><button type="button" onClick={() => navigate(`/management/receivables/customer/${customerId}/receivable/${item.id}`)} className="mt-4 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white">Lihat Detail Nota</button></div>; })}</div></div>
        </div>
      );
    }

    const sale = selected.sale;
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => navigate(`/management/receivables/customer/${customerId}`)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"><span aria-hidden="true">&larr;</span> Kembali ke Detail Piutang</button>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6"><p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Piutang</p><h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Detail Nota</h1><div className="mt-6 grid gap-4 sm:grid-cols-2"><div><p className="text-sm text-slate-500 dark:text-slate-400">Nomor Nota</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{sale?.invoice_number || `Nota #${selected.id}`}</p></div><div><p className="text-sm text-slate-500 dark:text-slate-400">Tanggal Nota</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatDate(sale?.created_at || selected.created_at)}</p></div><div><p className="text-sm text-slate-500 dark:text-slate-400">Jatuh Tempo</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatDate(selected.due_date)}</p></div><div><p className="text-sm text-slate-500 dark:text-slate-400">Pelanggan</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{selected.customer?.name || '-'}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selected.customer?.phone || '-'} | {selected.customer?.address || '-'}</p></div></div></div>
        <div className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"><h2 className="text-lg font-semibold">Daftar Barang</h2><div className="mt-4 space-y-3">{sale?.items?.length ? sale.items.map((item) => { const total = getSaleItemTotal(item); const balance = getSaleItemBalance(item); const status = getSaleItemStatus(item); return <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"><div><p className="font-semibold">{item.product?.name || `Barang #${item.product_id}`}</p><p className="mt-1 text-sm text-slate-500">Qty: {item.quantity}</p><p className="mt-1 text-sm text-slate-500">Harga: Rp {Number(item.final_price || item.selling_price || item.unit_price || 0).toLocaleString('id-ID')}</p><p className="mt-1 text-sm text-slate-500">Subtotal: Rp {total.toLocaleString('id-ID')}</p></div><div className="sm:text-right"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusStyle(status)}`}>{status}</span><p className="mt-2 font-semibold">Sisa: Rp {balance.toLocaleString('id-ID')}</p><button type="button" disabled={balance <= 0} onClick={() => openItemPaymentModal(item)} className="mt-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-slate-400">{balance > 0 ? 'Bayar' : 'Lunas'}</button></div></div>; }) : <p className="text-sm text-slate-500">Detail barang tidak tersedia untuk nota ini.</p>}</div></div>
        <div className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"><h2 className="text-lg font-semibold">Riwayat Pembayaran</h2>{paymentHistory.length ? <div className="mt-4 space-y-3">{paymentHistory.map((payment) => <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-sm dark:border-slate-800"><span>{formatDate(payment.paid_at)}</span><span className="font-semibold">Rp {Number(payment.amount || 0).toLocaleString('id-ID')}</span></div>)}</div> : <p className="mt-4 text-sm text-slate-500">Belum ada pembayaran untuk nota/barang ini.</p>}<div className="mt-6 border-t border-slate-200 pt-4"><h2 className="text-lg font-semibold">Ringkasan Pembayaran</h2><div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><span>Total Nota: Rp {Number(selected.amount || 0).toLocaleString('id-ID')}</span><span>Total Dibayar: Rp {Number(selected.paid_amount || 0).toLocaleString('id-ID')}</span><span>Sisa: Rp {Math.max(0, Number(selected.amount || 0) - Number(selected.paid_amount || 0)).toLocaleString('id-ID')}</span></div><span className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusStyle(getReceivableStatus(selected))}`}>{getReceivableStatus(selected)}</span>{getReceivableStatus(selected) === 'LUNAS' ? <button type="button" onClick={() => setDeleteTarget(selected)} disabled={deleting} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">Hapus Nota</button> : null}</div></div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader className="h-8 w-8 animate-spin text-sky-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Piutang</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Daftar Piutang</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Pantau saldo pelanggan yang belum lunas dan catat cicilan dengan cepat.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500">Total Piutang</p>
              <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Rp {totals.total.toLocaleString('id-ID')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500">Sisa Belum Lunas</p>
              <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Rp {totals.balance.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-900/10 dark:text-rose-200">{error}</div>
      ) : null}

      {customerId ? renderNavigationDetail() : (
      <div className="block">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Daftar Piutang</h2>
              </div>
              <div className="w-full sm:max-w-md sm:flex-1 sm:pl-6">
                <input
                  type="text"
                  placeholder="Cari nama atau nomor telepon pelanggan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="app-table receivables-table w-full min-w-[760px] table-fixed divide-y divide-slate-200 dark:divide-slate-800">
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
                <col className="w-[15%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead className="bg-slate-50/95 dark:bg-slate-900/95">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 sm:px-5">Pelanggan</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 sm:px-5">Total Piutang</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 sm:px-5">Sisa Piutang</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 sm:px-5">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 sm:px-5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                {customerSummaries.length > 0 ? customerSummaries.map((summary) => {
                  return (
                    <tr key={summary.customer?.id || summary.receivables[0]?.id} className="h-[68px] transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70">
                      <td className="truncate px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 sm:px-5">{summary.customer?.name || 'Tanpa nama'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100 sm:px-5">Rp {summary.total.toLocaleString('id-ID')}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100 sm:px-5">Rp {summary.balance.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-left text-sm sm:px-5">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(summary.status)}`}>{summary.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm sm:px-5">
                        <button type="button" onClick={() => openCustomerDetail(summary)} className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg bg-sky-600 px-3 text-xs font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950">Detail Transaksi</button>
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-500">Belum ada data piutang.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {false && (<div className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Catat Pembayaran</h2>
          </div>
          {selected ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-500">Pelanggan</p>
                <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{selected.customer?.name}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{selected.customer?.phone || 'Nomor HP belum tersedia'}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{selected.customer?.address || 'Alamat belum tersedia'}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total piutang</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Rp {selectedCustomerReceivables.reduce((total, item) => total + Number(item.amount || 0), 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total dibayar</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Rp {selectedCustomerPaid.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total sisa</p>
                    <p className="mt-1 text-sm font-semibold text-sky-700 dark:text-sky-300">Rp {selectedCustomerBalance.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Daftar Nota</p>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{selectedCustomerReceivables.length} transaksi</span>
                </div>
                <div className="mt-3 space-y-2">
                  {selectedCustomerReceivables.map((item) => {
                    const balance = Math.max(0, Number(item.amount || 0) - Number(item.paid_amount || 0));
                    const noteStatus = getReceivableStatus(item);
                    const isSelected = item.id === selected.id;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3 transition ${isSelected ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.sale?.invoice_number || `Nota #${item.id}`}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(item.sale?.created_at || item.created_at)}</p>
                            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Total: Rp {Number(item.amount || 0).toLocaleString('id-ID')}</p>
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Dibayar: Rp {Number(item.paid_amount || 0).toLocaleString('id-ID')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Rp {balance.toLocaleString('id-ID')}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sisa</p>
                            <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusStyle(noteStatus)}`}>{noteStatus}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateSelectedHistory(item)}
                          className="mt-3 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700"
                        >
                          Lihat Detail
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 border-t border-slate-200 pt-4 text-right dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Total Sisa Piutang</p>
                  <p className="mt-1 text-xl font-semibold text-sky-700 dark:text-sky-300">Rp {selectedCustomerBalance.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-500">Nota terpilih</p>
                <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{selected.sale?.invoice_number || `Nota #${selected.id}`}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Sisa nota: Rp {Math.max(0, (selected.amount || 0) - (selected.paid_amount || 0)).toLocaleString('id-ID')}</p>
                <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusStyle(getReceivableStatus(selected))}`}>{getReceivableStatus(selected)}</span>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Keterangan: {selected.notes || '—'}</p>
                {getReceivableStatus(selected) === 'LUNAS' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Hapus piutang yang sudah lunas?')) deleteReceivable(selected.id);
                    }}
                    className="mt-3 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                  >
                    Hapus Nota Lunas
                  </button>
                ) : null}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pembayaran Per Barang</p>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Pilih tombol Bayar</span>
                </div>
                {selected.sale?.items?.length ? (
                  <div className="mt-3 space-y-2">
                    {selected.sale.items.map((item) => {
                      const balance = getSaleItemBalance(item);
                      const itemTotal = getSaleItemTotal(item);
                      const itemStatus = getSaleItemStatus(item);
                      return (
                        <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item.product?.name || `Barang #${item.product_id}`}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.quantity} x Rp {Number(item.final_price || item.selling_price || item.unit_price || 0).toLocaleString('id-ID')} = Rp {itemTotal.toLocaleString('id-ID')}</p>
                            <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">Sisa: Rp {balance.toLocaleString('id-ID')}</p>
                            <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusStyle(itemStatus)}`}>{itemStatus}</span>
                          </div>
                          <button
                            type="button"
                            disabled={balance <= 0}
                            onClick={() => openItemPaymentModal(item)}
                            className="shrink-0 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                          >
                            {balance > 0 ? 'Bayar' : 'Lunas'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Detail barang tidak tersedia untuk nota ini.</p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Riwayat Pembayaran</p>
                {paymentHistory.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">Rp {payment.amount.toLocaleString('id-ID')}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(payment.paid_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{payment.payment_method?.toUpperCase() || 'TUNAI'}</p>
                        {payment.notes ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{payment.notes}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Belum ada pembayaran tercatat.</p>
                )}
              </div>
              <form onSubmit={submitPayment} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Jumlah bayar</label>
                  <input type="number" min="1" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Metode pembayaran</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                    <option value="cash">Tunai</option>
                    <option value="transfer">Transfer</option>
                    <option value="qris">QRIS</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Catatan</label>
                  <textarea value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} rows="3" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                </div>
                <button type="submit" className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">Simpan Pembayaran</button>
              </form>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              Pilih satu piutang dari daftar untuk mencatat pembayaran.
            </div>
          )}
        </div>)}
      </div>
      )}
      {itemPaymentTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <form onSubmit={submitItemPayment} className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Pembayaran Piutang</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{itemPaymentTarget.product?.name || `Barang #${itemPaymentTarget.product_id}`}</h2>
              </div>
              <button type="button" onClick={closeItemPaymentModal} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">Tutup</button>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
              <div className="space-y-3 text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between gap-3">
                  <span>Pelanggan</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selected.customer?.name || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Barang</span>
                  <span className="text-right font-semibold text-slate-900 dark:text-slate-100">{itemPaymentTarget.product?.name || `Barang #${itemPaymentTarget.product_id}`}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Total barang</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Rp {getSaleItemTotal(itemPaymentTarget).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Sudah dibayar</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Rp {getSaleItemPaid(itemPaymentTarget).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                  <span>Sisa tagihan</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-300">Rp {getSaleItemBalance(itemPaymentTarget).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Status</span>
                  <span className="font-semibold text-sky-700 dark:text-sky-300">{getSaleItemStatus(itemPaymentTarget)}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nominal pembayaran</label>
                <input type="number" min="1" max={getSaleItemBalance(itemPaymentTarget)} value={itemPaymentAmount} onChange={(event) => { setItemPaymentAmount(event.target.value); setItemPaymentError(''); }} placeholder="Masukkan nominal pembayaran" required className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              </div>
              {itemPaymentError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{itemPaymentError}</p> : null}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Metode pembayaran</label>
                <select value={itemPaymentMethod} onChange={(event) => setItemPaymentMethod(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                  <option value="cash">Tunai</option>
                  <option value="transfer">Transfer</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Catatan</label>
                <textarea value={itemPaymentNote} onChange={(event) => setItemPaymentNote(event.target.value)} rows="3" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Riwayat Pembayaran Barang</p>
              {getSaleItemPayments(itemPaymentTarget).length > 0 ? (
                <div className="mt-3 space-y-2">
                  {getSaleItemPayments(itemPaymentTarget).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">
                      <span className="text-slate-500 dark:text-slate-400">{formatDate(payment.paid_at)}</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Rp {Number(payment.amount || 0).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Belum ada pembayaran untuk barang ini.</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeItemPaymentModal} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Batal</button>
              <button type="submit" disabled={itemPaymentSubmitting} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{itemPaymentSubmitting ? 'Menyimpan...' : 'Bayar'}</button>
            </div>
          </form>
        </div>
      ) : null}
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Hapus Nota?</h2>
            <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
              <p className="text-slate-500">Nota</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{deleteTarget.sale?.invoice_number || `Nota #${deleteTarget.id}`}</p>
              <p className="pt-2 text-slate-500">Status</p>
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">LUNAS</p>
            </div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Nota ini sudah lunas. Apakah Anda yakin ingin menghapus nota ini?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Batal</button>
              <button type="button" onClick={() => deleteReceivable(deleteTarget.id)} disabled={deleting} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">{deleting ? 'Menghapus...' : 'Hapus Nota'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
