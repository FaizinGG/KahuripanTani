import { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';

export default function MembershipPage() {
  const [membershipMembers, setMembershipMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [searchCustomerId, setSearchCustomerId] = useState('');
  const [customerMembership, setCustomerMembership] = useState(null);
  const [customerNotFoundId, setCustomerNotFoundId] = useState(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [memberForm, setMemberForm] = useState({ customer_id: '', customer_name: '', customer_phone: '' });
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemMember, setRedeemMember] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMembershipMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMembershipMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await axios.get('/api/memberships/members', { headers: { Authorization: `Bearer ${token}` } });
      const payload = res.data?.data ?? res.data;
      if (Array.isArray(payload)) {
        setMembershipMembers(payload);
      } else if (payload && typeof payload === 'object') {
        setMembershipMembers(Object.values(payload));
      } else {
        setMembershipMembers([]);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.message || 'Gagal memuat daftar anggota', type: 'error' });
      setMembershipMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const openRedeemModal = (member) => {
    setRedeemMember(member);
    setRedeemPoints(0);
    setIsRedeemModalOpen(true);
  };

  const closeRedeemModal = () => {
    setRedeemMember(null);
    setRedeemPoints(0);
    setIsRedeemModalOpen(false);
  };

  const handleRedeemPoints = async () => {
    if (!redeemMember) return;
    if (!redeemPoints || redeemPoints <= 0) {
      setToast({ message: 'Masukkan jumlah poin yang ingin ditukar', type: 'error' });
      return;
    }
    if (redeemPoints > redeemMember.loyalty_points) {
      setToast({ message: 'Jumlah poin melebihi saldo poin anggota', type: 'error' });
      return;
    }

    try {
      const res = await axios.post(`/api/memberships/${redeemMember.id}/redeem`, { points: redeemPoints }, { headers: { Authorization: `Bearer ${token}` } });
      setToast({ message: `Berhasil menukar ${redeemPoints} poin. Sisa poin: ${res.data.data.remaining_points}`, type: 'success' });
      closeRedeemModal();
      fetchMembershipMembers();
      if (customerMembership?.id === redeemMember.id) {
        setCustomerMembership({ ...customerMembership, loyalty_points: res.data.data.remaining_points });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.message || 'Gagal menukar poin', type: 'error' });
    }
  };

  const refreshData = async () => {
    await fetchMembershipMembers();
  };

  const openMemberModal = () => {
    setEditingMemberId(null);
    setIsMemberModalOpen(true);
    setMemberForm({ customer_id: '', customer_name: '', customer_phone: '' });
  };

  const openEditMemberModal = (member) => {
    setEditingMemberId(member.id);
    setIsMemberModalOpen(true);
    setMemberForm({ customer_id: member.customer_id, customer_name: member.customer_name, customer_phone: member.customer_phone });
  };

  const closeMemberModal = () => {
    setEditingMemberId(null);
    setIsMemberModalOpen(false);
    setMemberForm({ customer_id: '', customer_name: '', customer_phone: '' });
  };

  const handleSaveMember = async () => {
    if (!memberForm.customer_name) {
      setToast({ message: 'Masukkan nama anggota', type: 'error' });
      return;
    }
    if (!memberForm.customer_phone) {
      setToast({ message: 'Masukkan nomor HP anggota', type: 'error' });
      return;
    }

    try {
      if (editingMemberId) {
        await axios.put(`/api/memberships/${editingMemberId}`, { customer_name: memberForm.customer_name, customer_phone: memberForm.customer_phone }, { headers: { Authorization: `Bearer ${token}` } });
        setToast({ message: 'Data anggota berhasil diperbarui', type: 'success' });
      } else {
        await axios.post('/api/memberships/customer', memberForm, { headers: { Authorization: `Bearer ${token}` } });
        setToast({ message: 'Anggota berhasil ditambahkan', type: 'success' });
      }
      closeMemberModal();
      fetchMembershipMembers();
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.message || 'Gagal menyimpan anggota', type: 'error' });
    }
  };

  return (
    <div className="py-2">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-5 rounded-xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Program Keanggotaan</p>
              <h1 className="mt-2 text-2xl font-semibold">Anggota dan Poin</h1>
              <p className="mt-2 text-sm text-slate-300">Kelola anggota, saldo poin, dan penukaran hadiah.</p>
            </div>
            <button
              onClick={openMemberModal}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-2.5 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              + Tambah Anggota
            </button>
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 mb-6 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            Terjadi kesalahan: {error}
          </div>
        )}

        {/* Search Section */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm mb-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Cek atau Tukar Poin</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">ID Pelanggan</label>
              <input
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Masukkan ID pelanggan"
                value={searchCustomerId}
                onChange={(e) => setSearchCustomerId(e.target.value)}
              />
            </div>
            <button
              onClick={async () => {
                if (!searchCustomerId) {
                  setToast({ message: 'Masukkan ID pelanggan', type: 'error' });
                  return;
                }
                try {
                  const res = await axios.get(`/api/memberships/customer/${searchCustomerId}`, { headers: { Authorization: `Bearer ${token}` } });
                  setCustomerMembership(res.data.data);
                  setCustomerNotFoundId(null);
                  setToast({ message: 'Data keanggotaan ditemukan', type: 'success' });
                } catch (err) {
                  console.error(err);
                  if (err.response?.status === 404) {
                    setCustomerMembership(null);
                    setCustomerNotFoundId(searchCustomerId);
                    setToast({ message: 'Pelanggan belum terdaftar. Tambahkan sebagai anggota terlebih dahulu.', type: 'info' });
                  } else {
                    setCustomerMembership(null);
                    setCustomerNotFoundId(null);
                    setToast({ message: err.response?.data?.message || 'Data keanggotaan tidak ditemukan', type: 'error' });
                  }
                }
              }}
              className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700"
            >
              Cari
            </button>
          </div>

          {customerMembership && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">ID Pelanggan</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{customerMembership.customer_id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Nama</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{customerMembership.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Poin Tersedia</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{customerMembership.loyalty_points}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">Jumlah Poin Ditukar</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="0"
                    value={redeemPoints}
                    onChange={(e) => setRedeemPoints(Number(e.target.value))}
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!redeemPoints || redeemPoints <= 0) {
                      setToast({ message: 'Masukkan jumlah poin', type: 'error' });
                      return;
                    }
                    try {
                      const res = await axios.post(`/api/memberships/${customerMembership.id}/redeem`, { points: redeemPoints }, { headers: { Authorization: `Bearer ${token}` } });
                      setCustomerMembership({ ...customerMembership, loyalty_points: res.data.data.remaining_points });
                      setRedeemPoints(0);
                      setToast({ message: `Berhasil ditukar. Diskon: Rp${res.data.data.discount_amount}`, type: 'success' });
                    } catch (err) {
                      console.error(err);
                      setToast({ message: err.response?.data?.message || 'Gagal menukar poin', type: 'error' });
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
                >
                  Tukar Poin
                </button>
              </div>
            </div>
          )}

          {customerNotFoundId && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                ID pelanggan <strong>{customerNotFoundId}</strong> belum terdaftar sebagai anggota.
              </p>
              <button
                onClick={openMemberModal}
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                + Tambah sebagai Anggota
              </button>
            </div>
          )}
        </div>

        {/* Members List */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-6 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Daftar Anggota</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Anggota terdaftar dalam program poin.</p>
          </div>

          <div className="p-6">
            {loadingMembers ? (
              <div role="status" className="text-center text-slate-600 dark:text-slate-400">Memuat daftar anggota...</div>
            ) : membershipMembers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                Belum ada anggota. Tambahkan pelanggan ke program keanggotaan terlebih dahulu.
              </div>
            ) : (
              <div className="space-y-3">
                {membershipMembers.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{member.customer_name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{member.customer_phone}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          {member.loyalty_points} poin
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {member.joined_at?.split(' ')[0]}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditMemberModal(member)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                          Ubah
                        </button>
                        <button
                          onClick={() => openRedeemModal(member)}
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                        >
                          Tukar Poin
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm('Hapus keanggotaan ini?')) return;
                            try {
                              await axios.delete(`/api/memberships/${member.id}`, { headers: { Authorization: `Bearer ${token}` } });
                              setToast({ message: 'Keanggotaan berhasil dihapus', type: 'success' });
                              if (customerMembership?.id === member.id) {
                                setCustomerMembership(null);
                              }
                              fetchMembershipMembers();
                            } catch (err) {
                              console.error(err);
                              setToast({ message: err.response?.data?.message || 'Gagal menghapus keanggotaan', type: 'error' });
                            }
                          }}
                          className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={isMemberModalOpen}
        onClose={closeMemberModal}
        title={editingMemberId ? 'Ubah Anggota' : 'Tambah Anggota'}
        footer={
          <div className="flex gap-3">
            <button
              onClick={closeMemberModal}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Batal
            </button>
            <button
              onClick={handleSaveMember}
              className="flex-1 rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700"
            >
              {editingMemberId ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nama Anggota *</label>
            <input
              type="text"
              value={memberForm.customer_name}
              onChange={(e) => setMemberForm({ ...memberForm, customer_name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Nama lengkap anggota"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">Nomor HP *</label>
            <input
              type="text"
              value={memberForm.customer_phone}
              onChange={(e) => setMemberForm({ ...memberForm, customer_phone: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="08xx xxxx xxxx"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">ID Pelanggan (opsional)</label>
            <input
              type="text"
              value={memberForm.customer_id}
              onChange={(e) => setMemberForm({ ...memberForm, customer_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="ID pelanggan"
            />
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isRedeemModalOpen}
        onClose={closeRedeemModal}
        title={`Tukar Poin - ${redeemMember?.customer_name || ''}`}
        footer={
          <div className="flex gap-3">
            <button
              onClick={closeRedeemModal}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Batal
            </button>
            <button
              onClick={handleRedeemPoints}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
            >
              Tukar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-500/10">
            <p className="text-sm text-slate-600 dark:text-slate-400">Poin Tersedia</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{redeemMember?.loyalty_points ?? 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">Jumlah Poin *</label>
            <input
              type="number"
              value={redeemPoints}
              onChange={(e) => setRedeemPoints(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="0"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
