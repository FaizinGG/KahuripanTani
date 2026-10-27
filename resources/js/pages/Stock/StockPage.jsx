import { useState, useEffect } from 'react';
import { Edit2, AlertTriangle } from 'lucide-react';
import axios from '../../lib/axios';
import { Modal } from '../../components/common/Modal';
import { Table } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/common/FormInput';
import { Toast } from '../../components/common/Toast';

const API_URL = 'http://localhost:8000/api';

export default function StockPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    quantity_adjustment: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const token = localStorage.getItem('token');

  // Fetch stocks
  useEffect(() => {
    if (filter === 'low-stock') {
      fetchLowStocks();
    } else {
      fetchStocks();
    }
  }, [currentPage, filter]);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/stocks`, {
        params: {
          page: currentPage,
          per_page: 10,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setStocks(response.data.data);
      setTotalPages(response.data.meta.last_page);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Gagal memuat data stok',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStocks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/stocks/low-stock`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStocks(response.data);
      setTotalPages(1);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Gagal memuat data stok menipis',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (stock) => {
    setEditingId(stock.id);
    setFormData({
      quantity_adjustment: '',
      notes: '',
      product_id: stock.product_id,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ quantity_adjustment: '', notes: '', product_id: null });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.quantity_adjustment || formData.quantity_adjustment === '')
      errors.quantity_adjustment = 'Jumlah penyesuaian wajib diisi';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${API_URL}/stocks/adjust`,
        {
          product_id: formData.product_id,
          quantity: parseInt(formData.quantity_adjustment),
          notes: formData.notes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setToast({
        message: 'Stok berhasil disesuaikan',
        type: 'success',
      });

      closeModal();
      fetchStocks();
    } catch (error) {
      const errors = error.response?.data?.errors || {};
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
      } else {
        setToast({
          message: error.response?.data?.message || 'Gagal menyesuaikan stok',
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'product_name', label: 'Produk' },
    { key: 'quantity', label: 'Stok Saat Ini' },
    { key: 'minimal_stock', label: 'Batas Minimum' },
    {
      key: 'quantity',
      label: 'Status',
      render: (qty, row) => {
        const isLow = qty <= row.minimal_stock;
        return isLow ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
            <AlertTriangle className="h-3 w-3" />
            Stok Menipis
          </span>
        ) : (
          <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
            Tersedia
          </span>
        );
      },
    },
    {
      key: 'id',
      label: 'Aksi',
      render: (id, row) => (
        <button
          onClick={() => openModal(row)}
          aria-label="Sesuaikan stok"
          title="Sesuaikan stok"
          className="rounded-lg p-2 text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/10"
        >
          <Edit2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Manajemen Stok</h1>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setFilter('all');
            setCurrentPage(1);
          }}
          className={`min-h-10 rounded-lg px-4 py-2 font-medium ${
            filter === 'all'
              ? 'bg-sky-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          Semua Stok
        </button>
        <button
          onClick={() => {
            setFilter('low-stock');
            setCurrentPage(1);
          }}
          className={`min-h-10 rounded-lg px-4 py-2 font-medium ${
            filter === 'low-stock'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="h-4 w-4 inline-block mr-2" />
          Stok Menipis
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-6">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <Table
          columns={columns}
          data={stocks}
          loading={loading}
        />
        {filter === 'all' && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Sesuaikan Stok"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Batal
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              Sesuaikan Stok
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-sky-50 p-3 dark:bg-sky-500/10">
            <p className="text-sm text-sky-800 dark:text-sky-200">
              <strong>Catatan:</strong> Masukkan angka positif untuk menambah stok dan angka negatif untuk mengurangi.
            </p>
          </div>
          <FormInput
            label="Jumlah Penyesuaian"
            name="quantity_adjustment"
            type="number"
            value={formData.quantity_adjustment}
            onChange={handleInputChange}
            error={formErrors.quantity_adjustment}
            required
          />
          <FormInput
            label="Catatan"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Contoh: stok masuk, barang rusak"
          />
        </form>
      </Modal>
    </div>
  );
}
