import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from '../../lib/axios';
import { formatCurrency } from '../../lib/formatters';
import { AlertCircle, ShoppingCart, Plus, Minus, Trash2, CreditCard, PencilLine, FileText, CalendarDays, UserRound, Wallet, NotebookPen, BadgeCheck, BadgeAlert, Home, Phone, ReceiptText, Banknote, QrCode } from 'lucide-react';

const PRICE_TYPES = [
  { value: 'retail', label: 'Eceran' },
  { value: 'reseller', label: 'Reseller Kecil' },
  { value: 'reseller_besar', label: 'Reseller Besar' },
  { value: 'petugas', label: 'Petugas' },
  { value: 'sales', label: 'Tenaga Penjualan' },
];
const PRICE_TYPE_LABELS = Object.fromEntries(PRICE_TYPES.map((item) => [item.value, item.label]));

const POSPage = () => {
  const token = localStorage.getItem('token');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [qrisImageUrl, setQrisImageUrl] = useState(null);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [submittingSale, setSubmittingSale] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [debtorPhone, setDebtorPhone] = useState('');
  const [customerId, setCustomerId] = useState(null);
  const [customerMembership, setCustomerMembership] = useState(null);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [customerSearchMessage, setCustomerSearchMessage] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [activeDebtors, setActiveDebtors] = useState([]);
  const [activeDebtorsLoading, setActiveDebtorsLoading] = useState(false);
  const [activeDebtorSearch, setActiveDebtorSearch] = useState('');
  const [address, setAddress] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [notes, setNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentType, setPaymentType] = useState('full_payment');
  const [selectedPriceMode, setSelectedPriceMode] = useState('retail');
  const [editingPriceItemId, setEditingPriceItemId] = useState(null);
  const paidAmountInputRef = useRef(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, search]);

  useEffect(() => {
    if (showPaymentModal) {
      const timeoutId = window.setTimeout(() => paidAmountInputRef.current?.focus(), 180);
      return () => window.clearTimeout(timeoutId);
    }
  }, [showPaymentModal]);

  useEffect(() => {
    if (showPaymentModal && paymentMode === 'debt') {
      loadActiveDebtors();
    }
  }, [showPaymentModal, paymentMode]);

  useEffect(() => {
    if (!showPaymentModal || paymentMode !== 'qris') return;
    setQrisLoading(true);
    axios.get('/api/payment-settings/qris')
      .then((response) => setQrisImageUrl(response.data.data?.image_url || null))
      .catch(() => setQrisImageUrl(null))
      .finally(() => setQrisLoading(false));
  }, [showPaymentModal, paymentMode]);

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data.data || []);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Gagal memuat kategori';
      setError(message);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        per_page: 50,
      };
      if (selectedCategory) params.category_id = selectedCategory;
      if (search) params.search = search;

      const response = await axios.get('/api/products', {
        params: { ...params, is_active: true },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data.data || []);
      if (!response.data.data?.length) {
        setError('Tidak ada produk yang tersedia saat ini.');
      } else {
        setError('');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Gagal memuat produk';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getProductPrice = (product, priceType = selectedPriceMode) => {
    const value = priceType === 'retail'
      ? Number(product.price_retail ?? product.retail_price ?? 0)
      : priceType === 'reseller'
        ? Number(product.price_reseller_small ?? product.reseller_price ?? product.small_reseller_price ?? 0)
        : priceType === 'reseller_besar'
          ? Number(product.price_reseller_large ?? product.reseller_besar_price ?? product.large_reseller_price ?? 0)
          : priceType === 'petugas'
            ? Number(product.price_employee ?? product.petugas_price ?? product.employee_price ?? 0)
            : Number(product.price_sales ?? product.sales_price ?? 0);

    return Number.isFinite(value) ? value : 0;
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const price = getProductPrice(product, selectedPriceMode);
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
          price,
          price_type: selectedPriceMode,
          cost_price: Number(product.price_cost ?? product.cost_price ?? 0),
        },
      ]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const changeItemPriceType = (productId, priceType) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              price_type: priceType,
              price: getProductPrice(item, priceType),
            }
          : item
      )
    );
    setEditingPriceItemId(null);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0);
  };

  const formatCurrencyInput = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    const numericValue = Number(digits);
    return formatCurrency(numericValue);
  };

  const handleCurrencyInputChange = (setter, rawValue) => {
    const digits = String(rawValue ?? '').replace(/\D/g, '');
    setter(digits);
  };

  const handleSearchPhoneChange = (value) => {
    setSearchPhone(value);
    setCustomerId(null);
    setCustomerMembership(null);
    setCustomerSearchMessage('');
  };

  const loadActiveDebtors = async () => {
    setActiveDebtorsLoading(true);
    try {
      const response = await axios.get('/api/customers/active-debtors', {
        params: { per_page: 100 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setActiveDebtors(response.data.data || []);
    } catch (err) {
      setCustomerSearchMessage(err.response?.data?.message || 'Gagal memuat pelanggan dengan piutang aktif');
    } finally {
      setActiveDebtorsLoading(false);
    }
  };

  const searchCustomer = async () => {
if (!searchPhone) {
        setCustomerSearchMessage('Masukkan nama atau nomor HP pelanggan untuk mencari.');
        return;
      }

      setCustomerSearchLoading(true);
      setCustomerSearchMessage('');

      try {
        const response = await axios.get('/api/customers', {
          params: { search: searchPhone, per_page: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });

      const customers = response.data.data || [];
      setCustomerSearchResults(customers);
      if (!customers.length) {
        setCustomerId(null);
        setCustomerMembership(null);
        setCustomerSearchMessage('Pelanggan tidak ditemukan.');
        return;
      }

      if (customers.length === 1) {
        // auto select single result
        selectCustomer(customers[0]);
      } else {
        setCustomerSearchMessage(`Ditemukan ${customers.length} pelanggan. Pilih dari daftar.`);
      }
    } catch (err) {
      setCustomerId(null);
      setCustomerMembership(null);
      setCustomerSearchMessage(err.response?.data?.message || 'Gagal mencari pelanggan');
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const selectCustomer = async (customer) => {
    setCustomerId(customer.id);
    setCustomerName(customer.name || '');
    setDebtorPhone(customer.phone || '');
    setSearchPhone(customer.phone || '');
    setAddress(customer.address || '');
    setCustomerSearchMessage(`Pelanggan dipilih: ${customer.name}`);
    setCustomerSearchResults([]);
    try {
      const membershipResponse = await axios.get(`/api/memberships/customer/${customer.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomerMembership(membershipResponse.data.data);
    } catch (err) {
      setCustomerMembership(null);
    }
  };

  const filteredActiveDebtors = useMemo(() => {
    const query = activeDebtorSearch.trim().toLowerCase();
    if (!query) return activeDebtors;

    return activeDebtors.filter((debtor) =>
      [debtor.name, debtor.phone].some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [activeDebtorSearch, activeDebtors]);

  const invoiceNumber = useMemo(() => {
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(Math.floor(100 + Math.random() * 900));
    return `INV-${datePart}-${seq}`;
  }, []);

  const cashierName = useMemo(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
      return savedUser?.name || savedUser?.email || 'Kasir';
    } catch {
      return 'Kasir';
    }
  }, []);

  const calculateDiscount = () => {
    return Number(discountAmount || 0);
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - calculateDiscount());
  };

  const calculateBalance = () => {
    const nominal = Number(paidAmount || 0);
    const total = calculateTotal();
    return nominal - total;
  };

  const handlePaymentModeChange = (mode) => {
    setPaymentMode(mode);
    if (mode === 'debt') {
      setPaymentType('debt');
    } else {
      setPaymentType('full_payment');
    }
  };

  const calculateShortage = () => {
    const total = calculateTotal();
    const nominal = Number(paidAmount || 0);
    return Math.max(0, total - nominal);
  };

  const getPaymentStatus = () => {
    if (paymentMode === 'debt') return { label: 'PIUTANG', badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' };
    if (paymentMode === 'qris') return { label: 'MENUNGGU PEMBAYARAN', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' };
    const total = calculateTotal();
    const nominal = Number(paidAmount || 0);
    if (nominal >= total) return { label: 'LUNAS', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' };
    return { label: 'KURANG BAYAR', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' };
  };

  const debtRemaining = Math.max(0, calculateTotal() - Number(downPayment || 0));

  const resetPaymentState = () => {
    setShowPaymentModal(false);
    setCustomerName('');
    setCustomerId(null);
    setCustomerMembership(null);
    setCustomerSearchMessage('');
    setSearchPhone('');
    setDebtorPhone('');
    setActiveDebtorSearch('');
    setAddress('');
    setDueDate('');
    setDownPayment('');
    setNotes('');
    setDiscountAmount('');
    setPaidAmount('');
    setPaymentType('full_payment');
    setPaymentMode('cash');
  };

  const handleCheckout = async () => {
    if (paymentMode === 'qris' && !qrisImageUrl) {
      setError('QRIS belum dikonfigurasi. Silakan upload gambar QRIS terlebih dahulu melalui Pengaturan Pembayaran.');
      return;
    }

    setSubmittingSale(true);
    try {
      const subtotal = calculateSubtotal();
      const discount = calculateDiscount();
      const total = calculateTotal();
      const paid = paymentMode === 'debt' ? Number(downPayment || 0) : paymentMode === 'qris' ? total : Number(paidAmount || 0);
      const paymentTypeToSend = paymentMode === 'debt' ? 'debt' : (paymentMode === 'qris' || paid >= total ? 'full_payment' : 'owner_discount');
      const resolvedPaymentMethod = paymentMode === 'debt' ? 'debt' : paymentMode;
      const isOwnerDiscount = paymentTypeToSend === 'owner_discount';
      const payload = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: Number(item.price || 0),
          price_type: item.price_type || selectedPriceMode,
          cost_price: Number(item.cost_price || 0),
        })),
        subtotal,
        discount_amount: discount,
        diskon: discount,
        total_amount: total,
        total,
        payment_method: resolvedPaymentMethod,
        payment_type: paymentTypeToSend,
        dibayar: paid,
        paid_amount: paid,
        kembalian: Math.max(0, paid - total),
        change_amount: Math.max(0, paid - total),
        kekurangan: Math.max(0, total - paid),
        payment_status: isOwnerDiscount || paymentMode === 'debt' ? 'paid' : (paid >= total ? 'paid' : 'partial'),
        qris_confirmed: paymentMode === 'qris' ? true : undefined,
        customer_id: customerId || undefined,
        customer_name: customerName || undefined,
        phone: paymentMode === 'debt' ? debtorPhone || undefined : undefined,
        address: address || undefined,
        due_date: dueDate || undefined,
        down_payment: paymentMode === 'debt' ? Number(downPayment || 0) : undefined,
        notes: notes || undefined,
      };

      await axios.post('/api/sales', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart([]);
      resetPaymentState();
      setError('');
      alert(paymentMode === 'debt' ? 'Penjualan dengan piutang berhasil dicatat' : 'Penjualan berhasil dicatat');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memproses penjualan');
    } finally {
      setSubmittingSale(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-sky-600">Kasir</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Transaksi cepat & rapi</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pilih produk, tambahkan ke keranjang, dan selesaikan penjualan dengan mudah.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">Produk tersedia</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{products.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">Item di keranjang</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-6 dark:border-slate-800">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Daftar Produk</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Klik produk untuk menambah ke keranjang.</p>
                </div>
                <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row xl:max-w-xl">
                  <input
                    type="search"
                    placeholder="Cari produk..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <label className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 transition focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                    <span className="whitespace-nowrap font-medium">Mode Harga</span>
                    <select value={selectedPriceMode} onChange={(e) => setSelectedPriceMode(e.target.value)} className="min-w-0 cursor-pointer appearance-none border-0 bg-transparent p-0 text-sm shadow-none outline-none focus:border-transparent focus:ring-0">
                      {PRICE_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`min-h-10 rounded-xl border px-3 text-sm font-medium transition ${
                    !selectedCategory
                      ? 'border-sky-600 bg-sky-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  Semua
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`min-h-10 rounded-xl border px-3 text-sm font-medium transition ${
                      selectedCategory === cat.id
                        ? 'border-sky-600 bg-sky-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {error ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-900/10 dark:text-rose-200">
                  {error}
                </div>
              ) : (
                <div className="grid auto-rows-fr grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3 sm:gap-4">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addToCart(product)}
                      className="group flex h-full min-h-[190px] min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-sky-500 dark:hover:bg-slate-900"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <span className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{product.name}</span>
                        <span className="shrink-0 rounded-lg bg-sky-100 px-2 py-1 text-[11px] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                          {product.current_stock > 0 ? 'Tersedia' : 'Stok Habis'}
                        </span>
                      </div>
                      <div>
                        <p className="break-words text-lg font-semibold text-sky-700 dark:text-sky-300">{formatCurrency(getProductPrice(product, selectedPriceMode))}</p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Stok: {product.current_stock}</p>
                      </div>
                      <span className="mt-auto inline-flex min-h-10 items-center justify-center rounded-lg bg-sky-600 px-3 py-2 text-center text-sm font-semibold text-white transition group-hover:bg-sky-700">
                        Tambah ke keranjang
                      </span>
                    </button>
                  ))}
                  {products.length === 0 && !loading && (
                    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                      Tidak ada produk ditemukan.
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-t-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <ShoppingCart size={22} />
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-sky-100/80">Keranjang</p>
                  <p className="text-2xl font-semibold">{cart.reduce((sum, item) => sum + item.quantity, 0)} item</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  Keranjang kosong
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Jenis: {PRICE_TYPE_LABELS[item.price_type || 'retail']}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Harga: {formatCurrency(Number(item.price || 0))}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-600 transition hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="mt-4 flex flex-col gap-3 rounded-xl bg-white p-3 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button aria-label={`Kurangi jumlah ${item.name}`} onClick={() => updateQuantity(item.id, item.quantity - 1)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
                              <Minus size={16} />
                            </button>
                            <span className="min-w-[32px] text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{item.quantity}</span>
                            <button aria-label={`Tambah jumlah ${item.name}`} onClick={() => updateQuantity(item.id, item.quantity + 1)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
                              <Plus size={16} />
                            </button>
                          </div>
                          <button type="button" onClick={() => setEditingPriceItemId(editingPriceItemId === item.id ? null : item.id)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
                            <PencilLine size={14} /> Ubah Harga
                          </button>
                        </div>
                        {editingPriceItemId === item.id ? (
                          <select value={item.price_type || 'retail'} onChange={(e) => changeItemPriceType(item.id, e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                            {PRICE_TYPES.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : null}
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Qty: {item.quantity} • Subtotal: {formatCurrency(Number(item.price || 0) * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-6 dark:border-slate-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>Diskon</span>
                  <span>{formatCurrency(calculateDiscount())}</span>
                </div>
                <div className="flex items-center justify-between text-xl font-semibold text-slate-900 dark:text-slate-100">
                  <span>Total</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0}
                className={`mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${
                  cart.length === 0
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Selesaikan Transaksi
              </button>
              <button
                onClick={() => setCart([])}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Kosongkan Keranjang
              </button>
            </div>
          </section>
        </div>
      </div>

      {showPaymentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-3 py-3 sm:px-4">
          <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-h-[calc(100dvh-2rem)]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-sky-600">Pembayaran</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">Selesaikan transaksi</h2>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2"><FileText size={16} /> {invoiceNumber}</span>
                  <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span className="inline-flex items-center gap-2"><UserRound size={16} /> {cashierName}</span>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Tutup</button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {paymentMode === 'qris' ? (
                <section className="mx-auto flex w-full max-w-xl flex-col items-center p-6 text-center">
                  <div className="mb-6 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={() => handlePaymentModeChange('cash')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"><Wallet size={16} /> Tunai</button>
                    <button type="button" onClick={() => handlePaymentModeChange('qris')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-500 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200"><QrCode size={16} /> QRIS</button>
                    <button type="button" onClick={() => handlePaymentModeChange('debt')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"><ReceiptText size={16} /> Piutang</button>
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Pembayaran QRIS</p>
                  <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Total Pembayaran</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(calculateTotal())}</p>
                  <div className="mt-6 flex min-h-64 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    {qrisLoading ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Memuat konfigurasi QRIS...</p>
                    ) : qrisImageUrl ? (
                      <img src={qrisImageUrl} alt="QRIS pembayaran toko" className="max-h-80 max-w-full object-contain" />
                    ) : (
                      <p role="alert" className="max-w-sm text-sm font-medium text-rose-700 dark:text-rose-300">QRIS belum dikonfigurasi. Silakan upload gambar QRIS terlebih dahulu melalui Pengaturan Pembayaran.</p>
                    )}
                  </div>
                  {qrisImageUrl && (
                    <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <p>Silakan scan QRIS menggunakan aplikasi pembayaran.</p>
                      <p className="font-medium">Setelah pelanggan membayar, lakukan pengecekan secara manual.</p>
                    </div>
                  )}
                </section>
              ) : (
              <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handlePaymentModeChange('cash')} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${paymentMode === 'cash' ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'}`}>
                      <Wallet size={16} /> Tunai
                    </button>
                    <button type="button" onClick={() => handlePaymentModeChange('qris')} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${paymentMode === 'qris' ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'}`}>
                      <QrCode size={16} /> QRIS
                    </button>
                    <button type="button" onClick={() => handlePaymentModeChange('debt')} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${paymentMode === 'debt' ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'}`}>
                      <ReceiptText size={16} /> Piutang
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/70">
                    {paymentMode === 'debt' && (
                      <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Pelanggan dengan piutang aktif</p>
                          </div>
                          {activeDebtorsLoading && <span className="text-xs text-amber-700 dark:text-amber-300">Memuat...</span>}
                        </div>
                        <input
                          type="search"
                          value={activeDebtorSearch}
                          onChange={(event) => setActiveDebtorSearch(event.target.value)}
                          placeholder="Cari nama / nomor HP"
                          className="mt-3 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:border-amber-500/30 dark:bg-slate-900 dark:text-slate-100"
                        />
                        {!activeDebtorsLoading && activeDebtors.length === 0 ? (
                          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">Belum ada pelanggan dengan sisa piutang.</p>
                        ) : !activeDebtorsLoading && filteredActiveDebtors.length === 0 ? (
                          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">Pelanggan dengan piutang aktif tidak ditemukan.</p>
                        ) : (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {filteredActiveDebtors.map((debtor) => (
                              <div
                                key={debtor.id}
                                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 transition ${customerId === debtor.id ? 'border-amber-500 bg-white dark:bg-slate-900' : 'border-amber-200 bg-white/70 dark:border-amber-500/30 dark:bg-slate-900/60'}`}
                              >
                                <div className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{debtor.name}</span>
                                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{debtor.phone || 'Tanpa nomor HP'}</span>
                                  <span className="mt-2 block text-sm font-semibold text-amber-700 dark:text-amber-300">Sisa piutang: {formatCurrency(debtor.active_receivable_balance)}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => selectCustomer(debtor)}
                                  className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
                                >
                                  Pilih
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-[1.4fr_0.6fr]">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nomor HP Pelanggan</label>
                        <input
                          type="text"
                          value={searchPhone}
                          onChange={(e) => handleSearchPhoneChange(e.target.value)}
                          placeholder="Masukkan nama atau nomor HP"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={searchCustomer}
                        disabled={customerSearchLoading}
                        className="inline-flex h-full w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {customerSearchLoading ? 'Mencari...' : 'Cari Pelanggan'}
                      </button>
                    </div>
                    {customerSearchMessage && (
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{customerSearchMessage}</p>
                    )}
                      {customerSearchResults && customerSearchResults.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {customerSearchResults.map((c) => (
                            <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">
                              <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">{c.name || '-'}</div>
                                <div className="text-slate-500 dark:text-slate-400">{c.phone || '-'}</div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => selectCustomer(c)} className="rounded-lg bg-sky-600 px-3 py-1 text-sm font-semibold text-white">Pilih</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    {customerId && (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                        <div className="font-medium">Pelanggan ditemukan</div>
                        <div className="mt-2">Nama: {customerName || '-'}</div>
                        {customerMembership ? (
                          <div className="mt-2">Poin: {customerMembership.loyalty_points}</div>
                        ) : (
                          <div className="mt-2">Belum terdaftar sebagai anggota</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70">
                    {paymentMode === 'cash' ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Subtotal</label>
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">{formatCurrency(calculateSubtotal())}</div>
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Diskon</label>
                            <input type="text" inputMode="numeric" value={formatCurrencyInput(discountAmount)} onChange={(e) => handleCurrencyInputChange(setDiscountAmount, e.target.value)} placeholder="Rp 0" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Total</label>
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-lg font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">{formatCurrency(calculateTotal())}</div>
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nominal dibayar</label>
                            <input ref={paidAmountInputRef} type="text" inputMode="numeric" value={formatCurrencyInput(paidAmount)} onChange={(e) => handleCurrencyInputChange(setPaidAmount, e.target.value)} placeholder="Rp 0" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                          </div>
                        </div>
                        <div className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="inline-flex items-center gap-2"><Banknote size={16} /> Kembalian / Kekurangan</span>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${calculateBalance() >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>
                              {calculateBalance() >= 0 ? 'Kembali' : 'Kurang'}
                            </span>
                          </div>
                          <div className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                            {calculateBalance() >= 0 ? formatCurrency(calculateBalance()) : formatCurrency(calculateShortage())}
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Catatan</label>
                          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"><UserRound size={16} /> Nama pelanggan</label>
                            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                          </div>
                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"><Phone size={16} /> Nomor HP</label>
                            <input value={debtorPhone} onChange={(e) => setDebtorPhone(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"><CalendarDays size={16} /> Tanggal transaksi</label>
                            <input type="date" value={new Date().toISOString().slice(0, 10)} readOnly className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                          </div>
                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"><CalendarDays size={16} /> Jatuh tempo</label>
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"><Home size={16} /> Alamat</label>
                          <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"><CreditCard size={16} /> DP</label>
                            <input type="text" inputMode="numeric" value={formatCurrencyInput(downPayment)} onChange={(e) => handleCurrencyInputChange(setDownPayment, e.target.value)} placeholder="Rp 0" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                          </div>
                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"><NotebookPen size={16} /> Sisa piutang</label>
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-lg font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">{formatCurrency(debtRemaining)}</div>
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Catatan</label>
                          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70">
                    <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"><ReceiptText size={18} /> Ringkasan</div>
                    <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>Jumlah item</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Mode harga</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{PRICE_TYPE_LABELS[selectedPriceMode]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Diskon</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(calculateDiscount())}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Total</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(calculateTotal())}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Metode pembayaran</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{paymentMode === 'debt' ? 'Piutang' : paymentMode === 'qris' ? 'QRIS' : 'Tunai'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Status pembayaran</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatus().badgeClass}`}>{getPaymentStatus().label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <BadgeCheck size={16} className="mt-0.5 text-emerald-600" />
                      <span>Alur pembayaran dipisahkan agar kasir lebih cepat dan fokus pada satu skema tiap saat.</span>
                    </div>
                  </div>
                </aside>
              </div>
              )}
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">Batal</button>
                {paymentMode !== 'qris' || qrisImageUrl ? (
                  <button type="button" onClick={handleCheckout} disabled={submittingSale || (paymentMode === 'qris' && qrisLoading)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{paymentMode === 'qris' ? submittingSale ? 'Menyimpan...' : 'Pembayaran Diterima' : paymentMode === 'debt' ? 'Catat Piutang' : 'Simpan Transaksi'}</button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default POSPage;
