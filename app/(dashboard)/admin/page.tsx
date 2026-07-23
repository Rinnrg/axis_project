'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Users,
  UserCheck,
  Hourglass,
  AlertCircle,
  Calendar,
  Clock,
  Check,
  X,
  Loader2,
  Camera,
  FileText,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  BarChart2,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalEmployees: number;
  pendingUsers: number;
  pendingPermissions: number;
  presentToday: number;
  lateToday: number;
  leaveToday: number;
}

interface TodayAttendance {
  id: string;
  userId: string;
  employeeName: string;
  email: string;
  position: string;
  department: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'hadir' | 'telat' | 'izin' | 'alpha';
  notes: string;
  checkInPhoto: string | null;
  checkOutPhoto: string | null;
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  department: string | null;
  joinDate: string;
}

interface PendingPermission {
  id: string;
  userId: string;
  userName: string;
  department: string;
  type: 'izin' | 'cuti' | 'sakit';
  startDate: string;
  endDate: string;
  reason: string;
  attachment: string | null;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attendances, setAttendances] = useState<TodayAttendance[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingPermissions, setPendingPermissions] = useState<PendingPermission[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false); // hidden by default on mobile

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil data dashboard');
      setStats(data.stats);
      setAttendances(data.attendances || []);
      setPendingUsers(data.pendingUsers || []);
      setPendingPermissions(data.pendingPermissions || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleUserAction = async (userId: string, action: 'approve' | 'reject') => {
    const isApprove = action === 'approve';
    const result = await Swal.fire({
      title: isApprove ? 'Setujui Pendaftaran?' : 'Tolak Pendaftaran?',
      text: isApprove
        ? 'Pengguna ini akan diaktifkan dan dapat melakukan absensi.'
        : 'Pendaftaran pengguna ini akan ditolak.',
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isApprove ? '#10b981' : '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: isApprove ? 'Ya, setujui' : 'Ya, tolak',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-2xl' }
    });

    if (!result.isConfirmed) return;

    setActioningId(userId);
    try {
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses aksi');

      Swal.fire({
        title: 'Berhasil!',
        text: `Status pengguna telah diperbarui.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      });
      fetchDashboardData(true);
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err.message || 'Terjadi kesalahan.',
        icon: 'error',
        customClass: { popup: 'rounded-2xl' }
      });
    } finally {
      setActioningId(null);
    }
  };

  const handlePermissionAction = async (permissionId: string, status: 'approved' | 'rejected') => {
    const isApprove = status === 'approved';
    const result = await Swal.fire({
      title: isApprove ? 'Setujui Pengajuan Izin?' : 'Tolak Pengajuan Izin?',
      text: isApprove
        ? 'Pengajuan izin ini akan disetujui.'
        : 'Pengajuan izin ini akan ditolak.',
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isApprove ? '#10b981' : '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: isApprove ? 'Ya, setujui' : 'Ya, tolak',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-2xl' }
    });

    if (!result.isConfirmed) return;

    setActioningId(permissionId);
    try {
      const res = await fetch('/api/permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: permissionId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses pengajuan');

      Swal.fire({
        title: 'Berhasil!',
        text: `Pengajuan izin telah diperbarui.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      });
      fetchDashboardData(true);
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err.message || 'Terjadi kesalahan.',
        icon: 'error',
        customClass: { popup: 'rounded-2xl' }
      });
    } finally {
      setActioningId(null);
    }
  };

  const showPhoto = (url: string, title: string) => {
    Swal.fire({
      title: title,
      imageUrl: url,
      imageAlt: title,
      confirmButtonColor: '#4f46e5',
      confirmButtonText: 'Tutup',
      customClass: {
        popup: 'rounded-2xl',
        image: 'rounded-xl max-h-[70vh] object-contain'
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-500 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm">Memuat informasi dashboard admin...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="text-slate-500 text-sm mt-1">Ikhtisar kehadiran harian dan persetujuan tertunda</p>
        </div>
        <button
          onClick={() => fetchDashboardData()}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 bg-white rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards Grid */}
      {stats && (
        <div>
          {/* Mobile toggle button */}
          <div className="sm:hidden mb-3">
            <button
              onClick={() => setShowStats(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" />
                <span>{showStats ? 'Sembunyikan Statistik' : 'Tampilkan Statistik'}</span>
              </div>
              {showStats
                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          {/* Cards: always visible on sm+, togglable on mobile */}
          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${
            showStats ? 'block' : 'hidden sm:grid'
          }`}>
            {/* Total Employees */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Karyawan Aktif</p>
                <p className="text-2xl font-bold text-slate-950 mt-0.5">{stats.totalEmployees}</p>
              </div>
            </div>

            {/* Present Today */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Hadir Hari Ini</p>
                <p className="text-2xl font-bold text-slate-950 mt-0.5">{stats.presentToday}</p>
              </div>
            </div>

            {/* Late Today */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Terlambat Hari Ini</p>
                <p className="text-2xl font-bold text-slate-950 mt-0.5">{stats.lateToday}</p>
              </div>
            </div>

            {/* Leave Today */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Izin Hari Ini</p>
                <p className="text-2xl font-bold text-slate-950 mt-0.5">{stats.leaveToday}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Today's Presence (Takes 2 span on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Kehadiran Hari Ini</h2>
                <p className="text-xs text-slate-500 mt-0.5">Daftar kehadiran masuk & pulang realtime</p>
              </div>
              <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-600">
                {attendances.length} Log
              </span>
            </div>

            {attendances.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Belum ada presensi masuk hari ini</p>
                <p className="text-xs">Kehadiran karyawan akan muncul secara otomatis di sini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Nama & Posisi</th>
                      <th className="px-6 py-3.5">Masuk</th>
                      <th className="px-6 py-3.5">Pulang</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-center">Foto Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendances.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">{item.employeeName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{item.position} • {item.department}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-mono text-xs">
                          {item.checkInTime || '-'}
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-mono text-xs">
                          {item.checkOutTime || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.status === 'hadir'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'telat'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : item.status === 'izin'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.checkInPhoto ? (
                              <button
                                onClick={() => showPhoto(item.checkInPhoto!, `Bukti Masuk - ${item.employeeName}`)}
                                className="p-1 hover:bg-slate-100 text-indigo-600 rounded"
                                title="Lihat Foto Masuk"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                            {item.checkOutPhoto && (
                              <button
                                onClick={() => showPhoto(item.checkOutPhoto!, `Bukti Pulang - ${item.employeeName}`)}
                                className="p-1 hover:bg-slate-100 text-emerald-600 rounded"
                                title="Lihat Foto Pulang"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Approvals (Takes 1 span on desktop) */}
        <div className="space-y-6">
          
          {/* Pending Registration Approvals */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Persetujuan Karyawan Baru</span>
                  {pendingUsers.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                      {pendingUsers.length}
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Validasi akun pendaftaran karyawan baru</p>
              </div>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <Info className="w-5 h-5 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Tidak ada pendaftaran tertunda</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingUsers.map((user) => {
                  const isActioning = actioningId === user.id;
                  return (
                    <div key={user.id} className="p-4 flex items-start justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-950 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{user.email}</p>
                        <p className="text-slate-600 mt-1 font-medium">{user.position || '-'} • {user.department || '-'}</p>
                      </div>
                      
                      <div className="flex gap-1 shrink-0">
                        <button
                          disabled={isActioning}
                          onClick={() => handleUserAction(user.id, 'approve')}
                          className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Setujui"
                        >
                          {isActioning ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          disabled={isActioning}
                          onClick={() => handleUserAction(user.id, 'reject')}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Tolak"
                        >
                          {isActioning ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
              <Link
                href="/admin/management-role"
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center justify-center gap-0.5"
              >
                <span>Kelola Seluruh Pengguna</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Pending Leave Approvals */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Persetujuan Izin / Cuti</span>
                  {pendingPermissions.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-bold">
                      {pendingPermissions.length}
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Persetujuan dispensasi kehadiran karyawan</p>
              </div>
            </div>

            {pendingPermissions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <Info className="w-5 h-5 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Tidak ada pengajuan izin tertunda</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingPermissions.map((perm) => {
                  const isActioning = actioningId === perm.id;
                  return (
                    <div key={perm.id} className="p-4 flex flex-col gap-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-950">{perm.userName}</p>
                          <p className="text-[10px] text-slate-400">{perm.department}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                          {perm.type}
                        </span>
                      </div>

                      <div className="text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <p className="font-semibold text-slate-700 text-[10px]">
                          Tanggal: {perm.startDate} s/d {perm.endDate}
                        </p>
                        <p className="mt-1 leading-relaxed text-[11px]">
                          <strong>Alasan:</strong> {perm.reason}
                        </p>
                        {perm.attachment && (
                          <button
                            onClick={() => showPhoto(perm.attachment!, `Lampiran Izin - ${perm.userName}`)}
                            className="mt-2 text-indigo-600 hover:text-indigo-800 text-[10px] font-bold flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Lihat Lampiran</span>
                          </button>
                        )}
                      </div>

                      <div className="flex justify-end gap-1.5 mt-1">
                        <button
                          disabled={isActioning}
                          onClick={() => handlePermissionAction(perm.id, 'rejected')}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors font-semibold flex items-center gap-1 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                        <button
                          disabled={isActioning}
                          onClick={() => handlePermissionAction(perm.id, 'approved')}
                          className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition-colors font-semibold flex items-center gap-1 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
