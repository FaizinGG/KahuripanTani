import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import axios from '../../lib/axios';
import { Modal } from '../../components/common/Modal';
import { Table } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/common/Button';
import { FormInput, FormTextarea } from '../../components/common/FormInput';
import { Toast } from '../../components/common/Toast';

const API_URL = '/api';

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', phone: '', email: '', address: '', contact_person: '', notes: '', is_active: true });
  const [formErrors, setFormErrors] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, search]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/suppliers`, {
        params: { page: currentPage, search, per_page: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(response.data.data || []);
      setTotalPages(response.data.pagination?.last_page || 1);
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Gagal memuat pemasok', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (supplier = null) => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        code: supplier.code || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        contact_person: supplier.contact_person || '',
        notes: supplier.notes || '',
        is_active: Boolean(supplier.is_active),
      });
      setEditingId(supplier.id);
    } else {
      setFormData({ name: '', code: '', phone: '', email: '', address: '', contact_person: '', notes: '', is_active: true });
      setEditingId(null);
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', code: '', phone: '', email: '', address: '', contact_person: '', notes: '', is_active: true });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Nama pemasok wajib diisi';
    if (!formData.code.trim()) errors.code = 'Kode pemasok wajib diisi';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const payload = { ...formData, is_active: formData.is_active === true || formData.is_active === 'true' };
      if (editingId) {
        await axios.put(`${API_URL}/suppliers/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setToast({ message: 'Pemasok berhasil diperbarui', type: 'success' });
      } else {
        await axios.post(`${API_URL}/suppliers`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setToast({ message: 'Pemasok berhasil ditambahkan', type: 'success' });
      }
      closeModal();
      fetchSuppliers();
    } catch (error) {
      const errors = error.response?.data?.errors || {};
      if (Object.keys(errors).length) {
        setFormErrors(errors);
      } else {
        setToast({ message: error.response?.data?.message || 'Gagal menyimpan pemasok', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pemasok ini?')) return;
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/suppliers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setToast({ message: 'Pemasok berhasil dihapus', type: 'success' });
      fetchSuppliers();
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Gagal menghapus pemasok', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Nama' },
    { key: 'phone', label: 'Telepon' },
    { key: 'contact_person', label: 'Kontak' },
    { key: 'address', label: 'Alamat' },
    {
      key: 'id',
      label: 'Aksi',
      render: (id, row) => (
        <div className="flex gap-2">
          <button onClick={() => openModal(row)} className="text-blue-600 hover:text-blue-900">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(id)} className="text-red-600 hover:text-red-900">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pemasok</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Kelola daftar pemasok produk.</p>
          </div>
          <Button className="inline-flex items-center gap-2" onClick={() => openModal()}>
            <Plus className="h-5 w-5" />
            Tambah Pemasok
          </Button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input type="text" placeholder="Cari pemasok..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-12 py-2 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950">
        <Table columns={columns} data={suppliers} loading={loading} />
        <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Ubah Pemasok' : 'Tambah Pemasok'} footer={<><Button variant="secondary" onClick={closeModal}>Batal</Button><Button onClick={handleSubmit} loading={loading}>{editingId ? 'Simpan Perubahan' : 'Tambah'} Pemasok</Button></>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormInput label="Nama Pemasok" name="name" value={formData.name} onChange={handleInputChange} error={formErrors.name} required />
            <FormInput label="Kode Pemasok" name="code" value={formData.code} onChange={handleInputChange} error={formErrors.code} required />
            <FormInput label="Telepon" name="phone" value={formData.phone} onChange={handleInputChange} error={formErrors.phone} />
            <FormInput label="Email" name="email" value={formData.email} onChange={handleInputChange} error={formErrors.email} />
            <FormInput label="Nama Kontak" name="contact_person" value={formData.contact_person} onChange={handleInputChange} error={formErrors.contact_person} />
          </div>
          <FormTextarea label="Alamat" name="address" value={formData.address} onChange={handleInputChange} error={formErrors.address} />
          <FormTextarea label="Catatan" name="notes" value={formData.notes} onChange={handleInputChange} error={formErrors.notes} />
        </form>
      </Modal>
    </div>
  );
}
