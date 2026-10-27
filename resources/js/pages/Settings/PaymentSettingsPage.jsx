import { useEffect, useState } from 'react';
import { ImageUp, RefreshCw, Trash2, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from '../../lib/axios';

export default function PaymentSettingsPage() {
  const [qris, setQris] = useState({ configured: false, image_url: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadQris = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/payment-settings/qris');
      setQris(response.data.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Gagal memuat pengaturan QRIS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQris();
  }, []);

  const uploadQris = async (event) => {
    const image = event.target.files?.[0];
    event.target.value = '';
    if (!image) return;

    const allowedTypes = {
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
      png: ['image/png'],
      webp: ['image/webp'],
    };
    const extension = image.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes[extension] || (image.type && !allowedTypes[extension].includes(image.type))) {
      setError('File harus berupa gambar JPG, JPEG, PNG, atau WEBP.');
      setMessage('');
      return;
    }
    if (image.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar QRIS maksimal 5 MB.');
      setMessage('');
      return;
    }

    const formData = new FormData();
    formData.append('qris_image', image);
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await axios.post('/api/payment-settings/qris', formData);
      setQris(response.data.data);
      setMessage(response.data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Gagal mengunggah gambar QRIS.');
    } finally {
      setSaving(false);
    }
  };

  const deleteQris = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await axios.delete('/api/payment-settings/qris');
      setQris(response.data.data);
      setMessage(response.data.message);
      setConfirmDelete(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Gagal menghapus gambar QRIS.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Pengaturan Pembayaran</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">QRIS</h1>
      </header>

      <section className="max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"><QrCode size={22} /></span>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Gambar QRIS statis</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Format JPG, PNG, atau WebP; maksimum 5 MB.</p>
            </div>
          </div>
          {!loading && (
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${qris.configured ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200'}`}>
              {qris.configured ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {qris.configured ? 'Aktif' : 'Belum dikonfigurasi'}
            </span>
          )}
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
        {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{message}</p>}

        <div className="mt-5">
          {loading ? (
            <p className="text-sm text-slate-500">Memuat pengaturan QRIS...</p>
          ) : qris.configured ? (
            <img src={qris.image_url} alt="QRIS toko" className="mx-auto max-h-[420px] max-w-full rounded-xl border border-slate-200 object-contain dark:border-slate-700" />
          ) : (
            <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">Belum ada gambar QRIS</div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 ${saving ? 'pointer-events-none opacity-60' : ''}`}>
            {qris.configured ? <RefreshCw size={17} /> : <ImageUp size={17} />}
            {saving ? 'Menyimpan...' : qris.configured ? 'Ganti QRIS' : 'Upload Gambar QRIS'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={saving} onChange={uploadQris} />
          </label>
          {qris.configured && (
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10">
              <Trash2 size={17} /> Hapus QRIS
            </button>
          )}
        </div>
      </section>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setConfirmDelete(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="qris-delete-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h2 id="qris-delete-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">Hapus gambar QRIS?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">QRIS yang tersimpan akan dihapus dan tidak dapat digunakan untuk pembayaran sampai gambar QRIS baru diunggah.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmDelete(false)} disabled={saving} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Batal</button>
              <button type="button" onClick={deleteQris} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"><Trash2 size={16} /> {saving ? 'Menghapus...' : 'Hapus'}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}