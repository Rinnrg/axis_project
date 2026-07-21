'use client';

import { useAuth } from '@/lib/auth-context';
import { User, Mail, Phone, Briefcase, Building, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  const profileItems = [
    { label: 'Nama Lengkap', value: user?.name, icon: User },
    { label: 'Email', value: user?.email, icon: Mail },
    { label: 'No. Telepon', value: user?.phone, icon: Phone },
    { label: 'Posisi', value: user?.position, icon: Briefcase },
    { label: 'Departemen', value: user?.department, icon: Building },
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
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Profil Saya</h1>
          <p className="text-slate-600 mt-2">Informasi data diri karyawan</p>
        </div>

        {/* Avatar Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <span className="text-5xl font-bold text-white">{user?.name.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-slate-600">{user?.position}</p>
          </div>
        </div>

        {/* Profile Info Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {profileItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="bg-white rounded-lg shadow-sm p-6 space-y-2 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 text-slate-600">
                  <Icon className="w-4 h-4" />
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
                <p className="text-lg font-semibold text-slate-900">{item.value}</p>
              </div>
            );
          })}
        </div>

        {/* Employment Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Informasi Kerja</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">ID Karyawan</p>
              <p className="text-lg font-bold text-slate-900">#{user?.id}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Role</p>
              <p className="text-lg font-bold text-slate-900 capitalize">
                {user?.role === 'admin' ? 'Super Admin' : 'Karyawan'}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Status</p>
              <p className="text-lg font-bold text-emerald-600">Aktif</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
