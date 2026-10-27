import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Sparkles } from 'lucide-react';
import axios from '../../lib/axios';
import { Modal } from '../../components/common/Modal';
import { Table } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/common/Button';
import { FormInput, FormSelect, FormTextarea } from '../../components/common/FormInput';
import { Toast } from '../../components/common/Toast';
import { formatCurrency } from '../../lib/formatters';

const API_URL = '/api';
const UNIT_OPTIONS = [
  { value: 'PCS', label: 'PCS' },
  { value: 'Box', label: 'Box' },
  { value: 'Dus', label: 'Dus' },
  { value: 'Kg', label: 'Kg' },
  { value: 'Liter', label: 'Liter' },
  { value: 'Pack', label: 'Pack' },
  { value: 'Lusin', label: 'Lusin' },
];

function SearchableCreatableSelect({
  label,
  required = false,
  error,
  options = [],
  value,
  searchValue,
  onSearchChange,
  onSelectOption,
  onCreateOption,
  createLabel,
  loading = false,
  placeholder = 'Cari atau ketik kategori',
}) {
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const canCreate = !!searchValue.trim() && !options.some((option) => option.label.toLowerCase() === searchValue.trim().toLowerCase());

  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${error ? 'border-red-500' : 'border-slate-300'}`}
        />
        {isOpen && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectOption(option);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>{option.label}</span>
                  {value === option.value && <span className="text-xs text-emerald-600">Terpilih</span>}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500">Tidak ada kategori yang cocok</div>
            )}
            {canCreate && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onCreateOption();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 border-t border-slate-200 px-3 py-2 text-left text-sm font-medium text-sky-600 hover:bg-sky-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <Sparkles className="h-4 w-4" />
                {createLabel || `Buat kategori "${searchValue.trim()}"`}
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {loading && <p className="mt-1 text-xs text-slate-500">Menyimpan kategori...</p>}
    </div>
  );
}

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryCreating, setCategoryCreating] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierCreating, setSupplierCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    supplier_id: '',
    unit: 'PCS',
    description: '',
    price_cost: '',
    price_retail: '',
    price_reseller_small: '',
    price_reseller_large: '',
    price_employee: '',
    price_sales: '',
    stock: '0',
    minimal_stock: '0',
    image_url: '',
    brand: '',
    rack_location: '',
    notes: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProducts();
  }, [currentPage, search]);

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products`, {
        params: {
          page: currentPage,
          search: search,
          per_page: 10,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setProducts(response.data.data);
      setTotalPages(response.data.pagination?.last_page || 1);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Gagal mengambil data produk',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories?per_page=999`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategories(
        response.data.data.map((cat) => ({
          value: cat.id,
          label: cat.name,
        }))
      );
    } catch (error) {
      console.error('Gagal memuat kategori');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuppliers(
        response.data.data.map((supplier) => ({
          value: supplier.id,
          label: supplier.name,
        }))
      );
    } catch (error) {
      console.error('Gagal memuat pemasok');
    }
  };

  const formatCurrencyValue = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    const number = parseInt(digits, 10);
    return formatCurrency(number);
  };

  const parseCurrencyValue = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits ? parseInt(digits, 10) : 0;
  };

  const openModal = (product = null) => {
    // Refresh suppliers and categories when modal opens
    fetchSuppliers();
    fetchCategories();

    if (product) {
      const selectedCategory = categories.find((cat) => cat.value === product.category_id);
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category_id: product.category_id?.toString() || '',
        supplier_id: product.supplier_id?.toString() || '',
        unit: product.unit || 'PCS',
        description: product.description || '',
        price_cost: formatCurrencyValue(product.price_cost || product.cost_price),
        price_retail: formatCurrencyValue(product.price_retail || product.price_retail),
        price_reseller_small: formatCurrencyValue(product.price_reseller_small || product.small_reseller_price),
        price_reseller_large: formatCurrencyValue(product.price_reseller_large || product.large_reseller_price),
        price_employee: formatCurrencyValue(product.price_employee || product.employee_price),
        price_sales: formatCurrencyValue(product.price_sales || product.sales_price),
        stock: product.stock?.toString() || '0',
        minimal_stock: product.minimal_stock?.toString() || '0',
        image_url: product.image_url || '',
        brand: product.brand || '',
        rack_location: product.rack_location || '',
        notes: product.notes || '',
        is_active: Boolean(product.is_active),
      });
      setCategorySearch(selectedCategory?.label || '');
      const selectedSupplier = suppliers.find((supplier) => supplier.value === product.supplier_id);
      setSupplierSearch(selectedSupplier?.label || '');
      setEditingId(product.id);
    } else {
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        category_id: '',
        supplier_id: '',
        unit: 'PCS',
        description: '',
        price_cost: '',
        price_retail: '',
        price_reseller_small: '',
        price_reseller_large: '',
        price_employee: '',
        price_sales: '',
        stock: '0',
        minimal_stock: '0',
        image_url: '',
        brand: '',
        rack_location: '',
        notes: '',
        is_active: true,
      });
      setCategorySearch('');
      setSupplierSearch('');
      setEditingId(null);
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setCategorySearch('');
    setSupplierSearch('');
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

  const handleCurrencyInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: formatCurrencyValue(value),
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
    if (!formData.name.trim()) errors.name = 'Nama produk wajib diisi';

    const priceFields = ['price_cost', 'price_retail', 'price_reseller_small', 'price_reseller_large', 'price_employee', 'price_sales'];
    priceFields.forEach((field) => {
      if (formData[field] && Number.isNaN(parseCurrencyValue(formData[field]))) {
        errors[field] = 'Harga harus berupa angka';
      }
    });

    if (formData.stock && parseInt(formData.stock, 10) < 0) errors.stock = 'Stok awal tidak boleh negatif';
    if (formData.minimal_stock && parseInt(formData.minimal_stock, 10) < 0) errors.minimal_stock = 'Stok minimal tidak boleh negatif';
    return errors;
  };

  const handleCreateCategory = async () => {
    const name = categorySearch.trim();
    if (!name) return;

    try {
      setCategoryCreating(true);
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const response = await axios.post(
        `${API_URL}/categories`,
        { name, slug, is_active: true, display_order: 0 },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const createdCategory = response.data.data;
      const nextOption = { value: createdCategory.id, label: createdCategory.name };
      setCategories((prev) => [...prev, nextOption].sort((a, b) => a.label.localeCompare(b.label)));
      setFormData((prev) => ({ ...prev, category_id: String(createdCategory.id) }));
      setCategorySearch(createdCategory.name);
      setToast({ message: 'Kategori berhasil dibuat', type: 'success' });
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Gagal membuat kategori',
        type: 'error',
      });
    } finally {
      setCategoryCreating(false);
    }
  };

  const handleCreateSupplier = async () => {
    const name = supplierSearch.trim();
    if (!name) return;

    try {
      setSupplierCreating(true);
      // Generate code from name
      const code = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 20);

      const response = await axios.post(
        `${API_URL}/suppliers`,
        { name, code, is_active: true },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const createdSupplier = response.data.data;
      const nextOption = { value: createdSupplier.id, label: createdSupplier.name };
      setSuppliers((prev) => [...prev, nextOption].sort((a, b) => a.label.localeCompare(b.label)));
      setFormData((prev) => ({ ...prev, supplier_id: String(createdSupplier.id) }));
      setSupplierSearch(createdSupplier.name);
      setToast({ message: 'Pemasok berhasil ditambahkan', type: 'success' });
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Gagal menambahkan pemasok',
        type: 'error',
      });
    } finally {
      setSupplierCreating(false);
    }
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
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id, 10) : null,
        price_cost: parseCurrencyValue(formData.price_cost),
        price_retail: parseCurrencyValue(formData.price_retail),
        price_reseller_small: parseCurrencyValue(formData.price_reseller_small),
        price_reseller_large: parseCurrencyValue(formData.price_reseller_large),
        price_employee: parseCurrencyValue(formData.price_employee),
        price_sales: parseCurrencyValue(formData.price_sales),
        stock: parseInt(formData.stock, 10) || 0,
        minimal_stock: parseInt(formData.minimal_stock, 10) || 0,
        is_active: formData.is_active === true || formData.is_active === 'true',
      };

      if (editingId) {
        await axios.put(`${API_URL}/products/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setToast({ message: 'Produk berhasil diperbarui', type: 'success' });
      } else {
        await axios.post(`${API_URL}/products`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setToast({ message: 'Produk berhasil dibuat', type: 'success' });
      }

      closeModal();
      fetchProducts();
    } catch (error) {
      const errors = error.response?.data?.errors || {};
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
      } else {
        setToast({
          message: error.response?.data?.message || 'Gagal menyimpan produk',
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus produk ini?')) return;

    try {
      setLoading(true);
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setToast({ message: 'Produk berhasil dihapus', type: 'success' });
      fetchProducts();
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Gagal menghapus produk',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Nama' },
    { key: 'sku', label: 'SKU' },
    { key: 'category_name', label: 'Kategori' },
    {
      key: 'price_retail',
      label: 'Harga Jual',
      render: (price) => formatCurrency(price),
    },
    { key: 'current_stock', label: 'Stok' },
    {
      key: 'id',
      label: 'Aksi',
      render: (id, row) => (
        <div className="flex gap-2">
          <button onClick={() => openModal(row)} aria-label="Ubah produk" title="Ubah produk" className="rounded-lg p-2 text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/10">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(id)} aria-label="Hapus produk" title="Hapus produk" className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10">
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Daftar Produk</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Kelola produk, harga, stok, kategori, dan informasi tambahan dengan lebih fleksibel.
            </p>
          </div>

          <Button className="inline-flex items-center gap-2" onClick={() => openModal()}>
            <Plus className="h-5 w-5" />
            Tambah Produk
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama, SKU, barcode, atau kategori..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-12 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Total Produk: <span className="font-semibold text-slate-900 dark:text-slate-100">{products.length}</span>
          </div>
        </div>
      </div>

      {toast && (
        <div>
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950">
        <Table columns={columns} data={products} loading={loading} />
        <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Ubah Produk' : 'Tambah Produk'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Batal
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingId ? 'Perbarui' : 'Buat'} Produk
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormInput label="Nama Produk" name="name" value={formData.name} onChange={handleInputChange} error={formErrors.name} required />
            <FormInput label="SKU" name="sku" value={formData.sku} onChange={handleInputChange} error={formErrors.sku} />
            <FormInput label="Barcode" name="barcode" value={formData.barcode} onChange={handleInputChange} error={formErrors.barcode} />
            <SearchableCreatableSelect
              label="Kategori"
              required={false}
              error={formErrors.category_id}
              options={categories}
              value={formData.category_id}
              searchValue={categorySearch}
              onSearchChange={setCategorySearch}
              onSelectOption={(option) => {
                setFormData((prev) => ({ ...prev, category_id: option.value.toString() }));
                setCategorySearch(option.label);
              }}
              onCreateOption={handleCreateCategory}
              createLabel={`Buat kategori "${categorySearch.trim()}"`}
              loading={categoryCreating}
            />
            <SearchableCreatableSelect
              label="Pemasok"
              error={formErrors.supplier_id}
              options={suppliers}
              value={formData.supplier_id}
              searchValue={supplierSearch}
              onSearchChange={setSupplierSearch}
              onSelectOption={(option) => {
                setFormData((prev) => ({ ...prev, supplier_id: option.value.toString() }));
                setSupplierSearch(option.label);
              }}
              onCreateOption={handleCreateSupplier}
              createLabel={`Tambah pemasok "${supplierSearch.trim()}"`}
              loading={supplierCreating}
              placeholder="Cari atau ketik nama pemasok"
            />
            <FormSelect label="Satuan" name="unit" value={formData.unit} onChange={handleInputChange} options={UNIT_OPTIONS} />
            <FormInput label="Harga Modal" name="price_cost" value={formData.price_cost} onChange={handleCurrencyInputChange} error={formErrors.price_cost} />
            <FormInput label="Harga Eceran" name="price_retail" value={formData.price_retail} onChange={handleCurrencyInputChange} error={formErrors.price_retail} />
            <FormInput label="Harga Reseller Kecil" name="price_reseller_small" value={formData.price_reseller_small} onChange={handleCurrencyInputChange} error={formErrors.price_reseller_small} />
            <FormInput label="Harga Reseller Besar" name="price_reseller_large" value={formData.price_reseller_large} onChange={handleCurrencyInputChange} error={formErrors.price_reseller_large} />
            <FormInput label="Harga Petugas" name="price_employee" value={formData.price_employee} onChange={handleCurrencyInputChange} error={formErrors.price_employee} />
            <FormInput label="Harga Tenaga Penjualan" name="price_sales" value={formData.price_sales} onChange={handleCurrencyInputChange} error={formErrors.price_sales} />
            <FormInput label="Stok Awal" name="stock" type="number" value={formData.stock} onChange={handleInputChange} error={formErrors.stock} />
            <FormInput label="Stok Minimal" name="minimal_stock" type="number" value={formData.minimal_stock} onChange={handleInputChange} error={formErrors.minimal_stock} />
            <FormInput label="Merek" name="brand" value={formData.brand} onChange={handleInputChange} error={formErrors.brand} />
            <FormInput label="Lokasi Rak" name="rack_location" value={formData.rack_location} onChange={handleInputChange} error={formErrors.rack_location} />
            <FormInput label="Foto Produk (URL)" name="image_url" value={formData.image_url} onChange={handleInputChange} error={formErrors.image_url} />
            <FormSelect label="Status Produk" name="is_active" value={String(formData.is_active)} onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.value === 'true' }))} options={[{ value: 'true', label: 'Aktif' }, { value: 'false', label: 'Nonaktif' }]} />
          </div>
          <FormTextarea label="Deskripsi" name="description" value={formData.description} onChange={handleInputChange} error={formErrors.description} />
          <FormTextarea label="Catatan Produk" name="notes" value={formData.notes} onChange={handleInputChange} error={formErrors.notes} />
        </form>
      </Modal>
    </div>
  );
}
