'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';
import { 
  Check, 
  X, 
  Search, 
  UserCheck, 
  UserMinus, 
  Users, 
  Hourglass, 
  Loader2, 
  AlertCircle,
  Trash2
} from 'lucide-react';

interface User {
  id:         string;
  name:       string;
  email:      string;
  phone:      string | null;
  position:   string | null;
  department: string | null;
  role:       'employee' | 'admin';
  joinDate:   string;
  status:     'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  
  // Track action state for individual users
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil data pengguna');
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5 * 60 * 60 * 1000); // 5-hour polling
    return () => clearInterval(interval);
  }, []);

  // Handle Approve/Reject Action
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

    setActioningUserId(userId);
    setError('');

    try {
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui status');

      // Update local state
      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
            : user
        )
      );

      Swal.fire({
        title: 'Berhasil!',
        text: `Status pengguna telah diperbarui menjadi ${isApprove ? 'Aktif' : 'Ditolak'}.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      });
    } catch (err: any) {
      setError(err.message || 'Gagal memproses aksi');
      Swal.fire({
        title: 'Gagal!',
        text: err.message || 'Terjadi kesalahan saat memproses aksi.',
        icon: 'error',
        customClass: { popup: 'rounded-2xl' }
      });
    } finally {
      setActioningUserId(null);
    }
  };

  // Handle Delete Action
  const handleDeleteUser = async (userId: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Semua data terkait (presensi, izin) juga akan dihapus secara permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-2xl' }
    });

    if (!result.isConfirmed) return;

    setActioningUserId(userId);
    setError('');
    try {
      const res = await fetch(`/api/users?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus pengguna');

      // Update local state by removing user
      setUsers(prev => prev.filter(user => user.id !== userId));

      Swal.fire({
        title: 'Terhapus!',
        text: 'Pengguna telah berhasil dihapus.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      });
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus pengguna');
      Swal.fire({
        title: 'Gagal!',
        text: err.message || 'Gagal menghapus pengguna.',
        icon: 'error',
        customClass: { popup: 'rounded-2xl' }
      });
    } finally {
      setActioningUserId(null);
    }
  };

  // Stats
  const totalUsers = users.length;
  const pendingCount = users.filter(u => u.status === 'PENDING').length;
  const approvedCount = users.filter(u => u.status === 'APPROVED').length;
  const rejectedCount = users.filter(u => u.status === 'REJECTED').length;

  // Filter and Search logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
      
    const matchesStatus = filterStatus === 'ALL' || u.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Manajemen Pengguna</h1>
        <p className="text-slate-500 text-sm mt-1">Validasi dan kelola akun karyawan sistem presensi</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Pengguna</p>
            <p className="text-2xl font-bold text-slate-950 mt-0.5">{totalUsers}</p>
          </div>
        </div>

        {/* Pending Validation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Hourglass className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Menunggu Validasi</p>
            <p className="text-2xl font-bold text-slate-950 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Disetujui / Aktif</p>
            <p className="text-2xl font-bold text-slate-950 mt-0.5">{approvedCount}</p>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <UserMinus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Ditolak</p>
            <p className="text-2xl font-bold text-slate-950 mt-0.5">{rejectedCount}</p>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Controls: Search & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, email, atau nomor HP..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Status */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(status => {
            const labels = {
              ALL: 'Semua',
              PENDING: 'Menunggu',
              APPROVED: 'Aktif',
              REJECTED: 'Ditolak'
            };
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  filterStatus === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {labels[status]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm">Memuat data pengguna...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Tidak ada pengguna ditemukan</p>
            <p className="text-sm">Coba sesuaikan kata kunci pencarian atau filter status Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nama Lengkap & Email</th>
                  <th className="px-6 py-4">Nomor HP</th>
                  <th className="px-6 py-4">Jabatan / Divisi</th>
                  <th className="px-6 py-4">Tanggal Bergabung</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => {
                  const isUserActioning = actioningUserId === user.id;
                  
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Name / Email */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-slate-600">
                        {user.phone || '-'}
                      </td>

                      {/* Position / Dept */}
                      <td className="px-6 py-4">
                        {user.position ? (
                          <div>
                            <p className="text-slate-800 font-medium">{user.position}</p>
                            <p className="text-xs text-slate-400">{user.department || 'Umum'}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Belum diisi</span>
                        )}
                      </td>

                      {/* Join Date */}
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(user.joinDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          user.status === 'APPROVED' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : user.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        }`}>
                          {user.status === 'APPROVED' ? 'Aktif' : user.status === 'REJECTED' ? 'Ditolak' : 'Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          
                          {/* Approve Action */}
                          {(user.status === 'PENDING' || user.status === 'REJECTED') && (
                            <button
                              disabled={isUserActioning}
                              onClick={() => handleUserAction(user.id, 'approve')}
                              className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 
                                         rounded-lg transition-colors disabled:opacity-50"
                              title="Setujui Pendaftaran"
                            >
                              {isUserActioning ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Reject Action */}
                          {(user.status === 'PENDING' || user.status === 'APPROVED') && user.role !== 'admin' && (
                            <button
                              disabled={isUserActioning}
                              onClick={() => handleUserAction(user.id, 'reject')}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 
                                         rounded-lg transition-colors disabled:opacity-50"
                              title="Tolak Pendaftaran"
                            >
                              {isUserActioning ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Delete Action */}
                          <button
                            disabled={isUserActioning}
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200
                                       rounded-lg transition-colors disabled:opacity-50"
                            title="Hapus Pengguna"
                          >
                            {isUserActioning ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
