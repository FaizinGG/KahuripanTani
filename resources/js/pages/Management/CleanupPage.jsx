import { useState, useEffect } from 'react';
import { Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import axios from '../../lib/axios';
import { Toast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';

const API_URL = '/api';

export default function CleanupPage() {
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUnusedItems();
  }, [activeTab]);

  const fetchUnusedItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/cleanup/unused`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setCategories(response.data.categories || []);
      setSuppliers(response.data.suppliers || []);
      setSelectedItems([]);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Gagal mengambil data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const currentItems = activeTab === 'categories' ? categories : suppliers;
  const unusedItems = currentItems.filter(item => item.products_count === 0);

  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === unusedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(unusedItems.map(item => item.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      setToast({
        message: 'Pilih item yang ingin dihapus',
        type: 'warning',
      });
      return;
    }

    const itemType = activeTab === 'categories' ? 'kategori' : 'pemasok';
    if (!window.confirm(`Yakin ingin menghapus ${selectedItems.length} ${itemType}?`)) {
      return;
    }

    try {
      setDeleting(true);
      const endpoint = activeTab === 'categories' ? 'categories' : 'suppliers';
      
      for (const id of selectedItems) {
        await axios.delete(`${API_URL}/${endpoint}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setToast({
        message: `${selectedItems.length} ${itemType} berhasil dihapus`,
        type: 'success',
      });
      
      fetchUnusedItems();
    } catch (error) {
      setToast({
        message: error.response?.data?.message || `Gagal menghapus ${itemType}`,
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSingleDelete = async (id) => {
    const itemType = activeTab === 'categories' ? 'kategori' : 'pemasok';
    if (!window.confirm(`Yakin ingin menghapus ${itemType} ini?`)) return;

    try {
      setDeleting(true);
      const endpoint = activeTab === 'categories' ? 'categories' : 'suppliers';
      
      await axios.delete(`${API_URL}/${endpoint}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setToast({
        message: `${itemType} berhasil dihapus`,
        type: 'success',
      });
      
      fetchUnusedItems();
    } catch (error) {
      setToast({
        message: error.response?.data?.message || `Gagal menghapus ${itemType}`,
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pembersihan Data</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Hapus kategori dan pemasok yang tidak digunakan produk.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'categories'
                ? 'border-b-2 border-sky-600 text-sky-700 dark:text-sky-300'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Kategori Tidak Terpakai ({categories.filter(c => c.product_count === 0).length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'suppliers'
                ? 'border-b-2 border-sky-600 text-sky-700 dark:text-sky-300'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
            Pemasok Tidak Terpakai ({suppliers.filter(s => s.product_count === 0).length})
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Content */}
      {loading ? (
        <div role="status" className="py-12 text-center">
          <div className="inline-block animate-spin">⏳</div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Memuat data...</p>
        </div>
      ) : unusedItems.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Tidak Ada Data Tidak Terpakai</h3>
            <p className="mt-2 text-green-700 dark:text-green-300">Semua {activeTab === 'categories' ? 'kategori' : 'pemasok'} sedang digunakan oleh produk.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          {/* Bulk Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedItems.length === unusedItems.length && unusedItems.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {selectedItems.length} dari {unusedItems.length} dipilih
              </span>
            </div>
            {selectedItems.length > 0 && (
              <Button
                onClick={handleBulkDelete}
                loading={deleting}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
              >
                <Trash2 className="h-4 w-4" />
                Hapus {selectedItems.length} Item
              </Button>
            )}
          </div>

          {/* Items List */}
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {unusedItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelectItem(item.id)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700"
                />
                
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                      <AlertCircle className="h-3 w-3" />
                      Tidak ada produk
                    </span>
                    {item.description && (
                      <span className="text-slate-500 dark:text-slate-400">{item.description}</span>
                    )}
                    {item.phone && (
                      <span className="text-slate-500 dark:text-slate-400">Telepon: {item.phone}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleSingleDelete(item.id)}
                  disabled={deleting}
                  aria-label={`Hapus ${item.name}`}
                  title={`Hapus ${item.name}`}
                  className="ml-auto rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Items Summary */}
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-500/30 dark:bg-sky-500/10">
        <h3 className="mb-3 font-semibold text-sky-900 dark:text-sky-100">Ringkasan Penggunaan</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-white p-3 text-center dark:bg-slate-900">
            <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Total Kategori</div>
          </div>
          <div className="rounded-lg bg-white p-3 text-center dark:bg-slate-900">
            <div className="text-2xl font-bold text-red-600">{categories.filter(c => c.product_count === 0).length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Kategori Tidak Terpakai</div>
          </div>
          <div className="rounded-lg bg-white p-3 text-center dark:bg-slate-900">
            <div className="text-2xl font-bold text-blue-600">{suppliers.length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Total Pemasok</div>
          </div>
          <div className="rounded-lg bg-white p-3 text-center dark:bg-slate-900">
            <div className="text-2xl font-bold text-red-600">{suppliers.filter(s => s.product_count === 0).length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Pemasok Tidak Terpakai</div>
          </div>
        </div>
      </div>
    </div>
  );
}
