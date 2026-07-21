'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSession } from 'next-auth/react';
import { User, Mail, Phone, Briefcase, Building, Calendar, Edit3, Save, X, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ProfilePage() {
  const { user } = useAuth();
  const { update } = useSession();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sync inputs with user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama lengkap tidak boleh kosong');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui profil');

      // Update NextAuth session cookie
      await update();

      Swal.fire({
        title: 'Berhasil!',
        text: 'Profil Anda telah berhasil diperbarui.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const profileItems = [
    { label: 'Nama Lengkap', value: user?.name, icon: User },
    { label: 'Email', value: user?.email, icon: Mail },
    { label: 'No. Telepon', value: user?.phone || '-', icon: Phone },
    { label: 'Posisi', value: user?.position || '-', icon: Briefcase },
    { label: 'Departemen', value: user?.department || '-', icon: Building },
    {
      label: 'Tanggal Bergabung',
      value: user?.joinDate
        ? new Date(user.joinDate).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : '-',
      icon: Calendar,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Profil Saya</h1>
            <p className="text-slate-600 mt-1">Informasi data diri karyawan</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profil</span>
            </button>
          )}
        </div>

        {/* Avatar Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover mx-auto shadow-md border-2 border-indigo-500"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <span className="text-5xl font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-slate-600 text-sm">{user?.position || '-'}</p>
          </div>
        </div>

        {isEditing ? (
          /* Edit Mode Form */
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">Edit Data Diri</h3>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Name Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Phone Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">No. Telepon / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Read-only system fields during edit mode */}
            <div className="bg-slate-50 rounded-xl p-4 grid md:grid-cols-2 gap-4 text-xs text-slate-500">
              <div>
                <span className="font-semibold text-slate-600 block">Email:</span>
                <span>{user?.email}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600 block">Posisi / Departemen:</span>
                <span>{user?.position || '-'} • {user?.department || '-'}</span>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* View Mode Grid */
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {profileItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-2 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 text-slate-500">
                      <Icon className="w-4 h-4" />
                      <p className="text-xs font-semibold uppercase tracking-wider">{item.label}</p>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{item.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Employment Info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">Informasi Kerja</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">ID Karyawan</p>
                  <p className="text-lg font-bold text-slate-950">#{user?.id}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Role</p>
                  <p className="text-lg font-bold text-slate-950 capitalize">
                    {user?.role === 'admin' ? 'Super Admin' : 'Karyawan'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Status</p>
                  <p className="text-lg font-bold text-emerald-600 uppercase tracking-wide">Aktif</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
