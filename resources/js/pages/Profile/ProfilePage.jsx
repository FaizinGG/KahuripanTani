import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../lib/axios';
import PasswordInput from '../../components/PasswordInput';
import { Toast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';
import { Save, X } from 'lucide-react';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    position: '',
  });
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [changePassword, setChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      const data = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        username: user.username || '',
        position: user.position || '',
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push('Nama wajib diisi');
    if (!formData.email.trim()) errors.push('Email wajib diisi');
    if (!formData.email.includes('@')) errors.push('Email tidak valid');
    return errors;
  };

  const validatePasswordForm = () => {
    const errors = [];
    if (!passwordData.current_password) errors.push('Password saat ini wajib diisi');
    if (!passwordData.new_password) errors.push('Password baru wajib diisi');
    if (passwordData.new_password.length < 6) errors.push('Password minimal 6 karakter');
    if (passwordData.new_password !== passwordData.confirm_password) errors.push('Konfirmasi password tidak sesuai');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      setToast({ message: errors.join(', '), type: 'error' });
      return;
    }

    try {
      setLoading(true);
      await axios.put(
        `/api/auth/profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOriginalData(formData);
      setToast({ message: 'Profil berhasil diperbarui', type: 'success' });
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Gagal memperbarui profil',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errors = validatePasswordForm();
    if (errors.length > 0) {
      setToast({ message: errors.join(', '), type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.confirm_password,
      };
      await axios.put(
        `/api/auth/password`,
        submitData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setChangePassword(false);
      setToast({ message: 'Password berhasil diperbarui', type: 'success' });
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Gagal memperbarui password',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormChanged = JSON.stringify(formData) !== JSON.stringify(originalData);

  return (
    <div className="min-h-screen bg-slate-100 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-8 dark:border-slate-800">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Edit Profil</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Kelola informasi profil dan pengaturan akun Anda</p>
          </div>

          <div className="p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">Nomor Telepon</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">Alamat</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">Posisi/Jabatan</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={!isFormChanged || loading}
                  className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  Simpan Perubahan
                </button>
              </div>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-800">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Keamanan Akun</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Kelola password dan keamanan akun Anda</p>

              {!changePassword ? (
                <button
                  type="button"
                  onClick={() => setChangePassword(true)}
                  className="mt-4 rounded-lg bg-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Ubah Password
                </button>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Password Saat Ini <span className="text-rose-500">*</span>
                    </label>
                    <PasswordInput
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      className="mt-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Password Baru <span className="text-rose-500">*</span>
                    </label>
                    <PasswordInput
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      className="mt-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Konfirmasi Password <span className="text-rose-500">*</span>
                    </label>
                    <PasswordInput
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      className="mt-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={18} />
                      Simpan Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChangePassword(false);
                        setPasswordData({
                          current_password: '',
                          new_password: '',
                          confirm_password: '',
                        });
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <X size={18} />
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
