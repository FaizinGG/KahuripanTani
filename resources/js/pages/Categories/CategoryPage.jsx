import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import axios from '../../lib/axios';
import { Modal } from '../../components/common/Modal';
import { Table } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/common/FormInput';
import { Toast } from '../../components/common/Toast';

const API_URL = 'http://localhost:8000/api';

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: '0',
  });
  const [formErrors, setFormErrors] = useState({});

  const token = localStorage.getItem('token');

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, [currentPage, search]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/categories`, {
        params: {
          page: currentPage,
          search: search,
          per_page: 10,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategories(response.data.data || []);
      setTotalPages(response.data.pagination?.last_page || 1);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Gagal memuat kategori',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        display_order: category.display_order?.toString() || '0',
      });
      setEditingId(category.id);
    } else {
      setFormData({
        name: '',
        description: '',
        display_order: '0',
      });
      setEditingId(null);
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '', display_order: '0' });
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
    if (!formData.name.trim()) errors.name = 'Nama kategori wajib diisi';
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

      const payload = {
        name: formData.name,
        description: formData.description,
        display_order: parseInt(formData.display_order) || 0,
      };

      if (editingId) {
        await axios.put(
          `${API_URL}/categories/${editingId}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setToast({
          message: 'Kategori berhasil diperbarui',
          type: 'success',
        });
      } else {
        await axios.post(`${API_URL}/categories`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setToast({
          message: 'Kategori berhasil ditambahkan',
          type: 'success',
        });
      }

      closeModal();
      fetchCategories();
    } catch (error) {
      const errors = error.response?.data?.errors || {};
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
      } else {
        setToast({
          message: error.response?.data?.message || 'Gagal menyimpan kategori',
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kategori ini?')) return;

    try {
      setLoading(true);
      await axios.delete(`${API_URL}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setToast({
        message: 'Kategori berhasil dihapus',
        type: 'success',
      });
      fetchCategories();
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Gagal menghapus kategori',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Nama' },
    { key: 'description', label: 'Deskripsi' },
    { key: 'display_order', label: 'Urutan' },
    {
      key: 'id',
      label: 'Aksi',
      render: (id, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openModal(row)}
            aria-label="Ubah kategori"
            title="Ubah kategori"
            className="rounded-lg p-2 text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/10"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(id)}
            aria-label="Hapus kategori"
            title="Hapus kategori"
            className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kategori</h1>
        <Button onClick={() => openModal()}>
          <Plus className="h-5 w-5 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      {/* Search */}
      <div>
        <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
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
          data={categories}
          loading={loading}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Ubah Kategori' : 'Tambah Kategori'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Batal
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingId ? 'Simpan Perubahan' : 'Tambah'} Kategori
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nama Kategori"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={formErrors.name}
            required
          />
          <FormInput
            label="Deskripsi"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            error={formErrors.description}
          />
          <FormInput
            label="Urutan Tampilan"
            name="display_order"
            type="number"
            value={formData.display_order}
            onChange={handleInputChange}
            error={formErrors.display_order}
          />
        </form>
      </Modal>
    </div>
  );
}
