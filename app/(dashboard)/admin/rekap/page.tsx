'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';
import {
  Download,
  Calendar,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  X,
  Loader2,
  Trash2,
  FileSpreadsheet,
  RotateCcw,
  Clock,
} from 'lucide-react';

export default function RekapPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  
  const [rekap, setRekap] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [loadingPhotoId, setLoadingPhotoId] = useState<string | null>(null);

  // Fetch rekap data from API
  const fetchRekap = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = `/api/admin/rekap?month=${month}`;
      if (selectedDate) {
        url += `&date=${selectedDate}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Gagal memuat data rekap presensi');
      }
      const data = await res.json();
      setRekap(data.rekap || []);
      setEmployees(data.employees || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat mengambil data.');
    } finally {
      setLoading(false);
    }
  }, [month, selectedDate]);

  useEffect(() => {
    fetchRekap();
    const interval = setInterval(fetchRekap, 2 * 60 * 60 * 1000); // 2-hour polling
    return () => clearInterval(interval);
  }, [fetchRekap]);

  // Filter attendance data on the client side
  const filteredAttendance = rekap.filter((a) => {
    if (selectedDate && a.date !== selectedDate) return false;
    if (!employeeFilter) return true;
    return a.employeeName.toLowerCase().includes(employeeFilter.toLowerCase());
  });

  // Group by employee using the actual employees list returned from the API
  const attendanceByEmployee = employees.reduce(
    (acc, emp) => {
      const empAttendance = filteredAttendance.filter(
        (a) => a.employeeId === emp.id
      );
      if (empAttendance.length > 0) {
        acc[emp.id] = {
          employee: emp,
          records: empAttendance,
        };
      }
      return acc;
    },
    {} as Record<
      string,
      { employee: any; records: any[] }
    >
  );

  // Calculate statistics from filtered attendance
  const stats = {
    total: filteredAttendance.length,
    hadir: filteredAttendance.filter((a) => a.status === 'hadir').length,
    telat: filteredAttendance.filter((a) => a.status === 'telat').length,
    izinApproved: filteredAttendance.filter((a) => (a.status === 'izin' || a.permissionType === 'IZIN') && a.permissionStatus !== 'REJECTED').length,
    sakit: filteredAttendance.filter((a) => a.permissionType === 'SAKIT' && a.permissionStatus !== 'REJECTED').length,
    cuti: filteredAttendance.filter((a) => a.permissionType === 'CUTI' && a.permissionStatus !== 'REJECTED').length,
    alpha: filteredAttendance.filter((a) => a.status === 'alpha').length,
  };

  // ── Excel Export (7 Kolom: 1 Tanggal, 2 Nama, 3 Hadir, 4 Izin, 5 Sakit, 6 Cuti, 7 Telat) ──
  const buildExcelRows = (records: any[]) => {
    return records.map((item) => {
      const isHadir = item.status === 'hadir';
      const isTelat = item.status === 'telat';
      const permType = (item.permissionType || '').toUpperCase();
      const isIzin = permType === 'IZIN' || (item.status === 'izin' && !permType);
      const isSakit = permType === 'SAKIT';
      const isCuti = permType === 'CUTI';

      return {
        'Tanggal': new Date(item.date).toLocaleDateString('id-ID', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
        }),
        'Nama': item.employeeName,
        'Hadir': isHadir ? (item.checkInTime ? `✓ (${item.checkInTime})` : '✓') : '-',
        'Izin': isIzin ? '✓' : '-',
        'Sakit': isSakit ? '✓' : '-',
        'Cuti': isCuti ? '✓' : '-',
        'Telat': isTelat ? (item.checkInTime ? `✓ (${item.checkInTime})` : '✓') : '-',
      };
    });
  };

  const downloadExcel = async (records: any[], filename: string) => {
    try {
      const XLSX = await import('xlsx');
      const rows = buildExcelRows(records);
      const ws = XLSX.utils.json_to_sheet(rows);

      // Set 7 Column Widths
      ws['!cols'] = [
        { wch: 28 }, // 1. Tanggal
        { wch: 25 }, // 2. Nama
        { wch: 18 }, // 3. Hadir
        { wch: 14 }, // 4. Izin
        { wch: 14 }, // 5. Sakit
        { wch: 14 }, // 6. Cuti
        { wch: 18 }, // 7. Telat
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap Presensi');
      XLSX.writeFile(wb, filename);

      Swal.fire({
        icon: 'success',
        title: 'Export Excel Berhasil!',
        text: `File ${filename} telah berhasil diunduh.`,
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      });
    } catch (err: any) {
      console.error('Export error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Export Gagal',
        text: 'Terjadi kesalahan saat memproses file Excel.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' }
      });
    }
  };

  const handleExportMonth = () => {
    const label = selectedDate ? selectedDate : (month === 'all' ? 'semua' : month);
    downloadExcel(flatRecords, `Rekap_Presensi_${label}.xlsx`);
  };

  const handleExportAll = () => {
    downloadExcel(flatRecords, `Rekap_Presensi_Semua.xlsx`);
  };

  const handleResetFilters = () => {
    const d = new Date();
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDate('');
    setEmployeeFilter('');
  };

  // Handle previewing photo by fetching it on-demand
  const handlePreviewPhoto = async (id: string, type: 'checkin' | 'checkout' | 'attachment', title: string) => {
    const loadingKey = `${id}-${type}`;
    setLoadingPhotoId(loadingKey);
    try {
      const res = await fetch(`/api/admin/rekap/photo?id=${id}&type=${type}`);
      if (!res.ok) throw new Error('Gagal memuat gambar');
      const data = await res.json();
      if (data.url) {
        setPreviewImage({ url: data.url, title });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gambar Tidak Ditemukan',
          text: 'Bukti gambar tidak tersedia atau gagal dimuat.',
          confirmButtonColor: '#4f46e5',
          customClass: { popup: 'rounded-2xl' }
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Gambar',
        text: err.message || 'Terjadi kesalahan.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' }
      });
    } finally {
      setLoadingPhotoId(null);
    }
  };

  // Handle Delete Attendance Record
  const handleDeleteAttendance = async (attendanceId: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Data presensi ini akan dihapus secara permanen dari database.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-2xl' }
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/attendance?id=${attendanceId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus data presensi');

      setRekap((prev) => prev.filter((r) => r.id !== attendanceId));

      Swal.fire({
        title: 'Terhapus!',
        text: 'Data presensi telah berhasil dihapus.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err.message || 'Gagal menghapus data presensi.',
        icon: 'error',
        customClass: { popup: 'rounded-2xl' }
      });
    }
  };

  const getStatusBadge = (status: string, permissionType?: string | null, permissionStatus?: string | null) => {
    if (status === 'izin' && permissionType) {
      if (permissionStatus === 'REJECTED') return 'bg-slate-100 text-slate-500 border border-slate-300 line-through';
      if (permissionType === 'CUTI') return 'bg-violet-100 text-violet-700 border border-violet-200';
      if (permissionType === 'SAKIT') return 'bg-rose-100 text-rose-700 border border-rose-200';
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    }
    const styles: Record<string, string> = {
      hadir: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      telat: 'bg-amber-100 text-amber-700 border border-amber-200',
      izin: 'bg-blue-100 text-blue-700 border border-blue-200',
      alpha: 'bg-red-100 text-red-700 border border-red-200',
    };
    return styles[status] || styles.alpha;
  };

  const getStatusLabel = (status: string, permissionType?: string | null, permissionStatus?: string | null) => {
    if (status === 'izin' && permissionType) {
      const rejected = permissionStatus === 'REJECTED';
      if (permissionType === 'CUTI') return rejected ? '✗ Cuti (Ditolak)' : '🌴 Cuti';
      if (permissionType === 'SAKIT') return rejected ? '✗ Sakit (Ditolak)' : '🤒 Sakit';
      return rejected ? '✗ Izin (Ditolak)' : 'ℹ Izin';
    }
    const labels: Record<string, string> = {
      hadir: '✓ Hadir',
      telat: '⚠ Telat',
      izin: 'ℹ Izin',
      alpha: '✗ Alpha',
    };
    return labels[status] || status;
  };

  const getStatCardColors = (color: string) => {
    const styles: Record<string, string> = {
      slate: 'bg-slate-50 border-slate-200',
      emerald: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-50/80',
      amber: 'bg-amber-50 border-amber-200 hover:bg-amber-50/80',
      blue: 'bg-blue-50 border-blue-200 hover:bg-blue-50/80',
      rose: 'bg-rose-50 border-rose-200 hover:bg-rose-50/80',
      violet: 'bg-violet-50 border-violet-200 hover:bg-violet-50/80',
      red: 'bg-red-50 border-red-200 hover:bg-red-50/80',
    };
    return styles[color] || styles.slate;
  };

  const getStatTextColors = (color: string) => {
    const styles: Record<string, string> = {
      slate: 'text-slate-900',
      emerald: 'text-emerald-900',
      amber: 'text-amber-900',
      blue: 'text-blue-900',
      rose: 'text-rose-900',
      violet: 'text-violet-900',
      red: 'text-red-900',
    };
    return styles[color] || styles.slate;
  };

  // Flatten the grouped attendance record structure
  const flatRecords = (Object.values(attendanceByEmployee) as Array<{ employee: any; records: any[] }>)
    .flatMap((group) =>
      group.records.map((attendance) => ({
        ...attendance,
        employee: group.employee,
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatPosition = (pos: string | null) => {
    if (!pos) return '-';
    return pos.charAt(0).toUpperCase() + pos.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Rekap Presensi Karyawan</h1>
            <p className="text-slate-600 mt-1 text-sm">
              Kelola, saring per tanggal/bulan, dan export data presensi karyawan secara real-time.
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm self-start sm:self-auto">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memuat data...
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {[
            { label: 'Total Data', value: stats.total, color: 'slate' },
            { label: 'Hadir', value: stats.hadir, color: 'emerald' },
            { label: 'Telat', value: stats.telat, color: 'amber' },
            { label: 'Izin', value: stats.izinApproved, color: 'blue' },
            { label: 'Sakit', value: stats.sakit, color: 'rose' },
            { label: 'Cuti', value: stats.cuti, color: 'violet' },
            { label: 'Alpha', value: stats.alpha, color: 'red' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`border rounded-xl p-3.5 transition-all duration-300 hover:shadow-xs ${getStatCardColors(stat.color)}`}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{stat.label}</p>
              <p className={`text-2xl font-extrabold mt-1 ${getStatTextColors(stat.color)}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-600" />
              Filter Data Presensi
            </h2>

            {(selectedDate || employeeFilter || month === 'all') && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Filter Per Tanggal (Single Date) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Filter Per Tanggal
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Filter Bulan */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Filter Bulan
                </label>
                <label className="flex items-center gap-1 text-[11px] text-indigo-600 font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={month === 'all'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setMonth('all');
                      } else {
                        const d = new Date();
                        setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                      }
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                  />
                  Semua Bulan
                </label>
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="month"
                  value={month === 'all' ? '' : month}
                  disabled={month === 'all' || !!selectedDate}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>

            {/* Cari Nama Karyawan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Cari Karyawan
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama karyawan..."
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Export Buttons */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Export Excel (7 Kolom)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleExportMonth}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  title="Export data sesuai filter ke Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Filter Ini
                </button>
                <button
                  onClick={handleExportAll}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Export seluruh data ke Excel"
                >
                  <Download className="w-4 h-4" />
                  Semua
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
          {!loading && flatRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">No</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Karyawan</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Role / Jabatan</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Tanggal</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Jam Masuk</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Jam Pulang</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Keterangan</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Bukti Foto</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {flatRecords.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-4 text-xs text-slate-500 font-bold">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-900">
                        {item.employeeName}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-700 font-semibold">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-[11px] font-bold uppercase">
                          {formatPosition(item.employee?.position)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                        {new Date(item.date).toLocaleDateString(
                          'id-ID',
                          {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            timeZone: 'UTC',
                          }
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-700 font-mono font-bold">
                        {item.checkInTime || '-'}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-700 font-mono font-bold">
                        {item.checkOutTime || '-'}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${getStatusBadge(item.status, item.permissionType, item.permissionStatus)}`}
                        >
                          {getStatusLabel(item.status, item.permissionType, item.permissionStatus)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 max-w-[180px]">
                        {item.permissionType ? (
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="block font-bold text-[10px] uppercase tracking-wider text-slate-400">{item.permissionType}</span>
                              {item.permissionStatus === 'REJECTED' && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-bold uppercase">Ditolak</span>
                              )}
                              {item.permissionStatus === 'APPROVED' && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[9px] font-bold uppercase">Disetujui</span>
                              )}
                            </div>
                            <span className="text-xs leading-relaxed line-clamp-2">{item.permissionReason || '-'}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">{item.notes || '-'}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="flex flex-wrap gap-1.5">
                          {item.hasCheckInPhoto && (
                            <button
                              disabled={loadingPhotoId === `${item.id}-checkin`}
                              onClick={() => handlePreviewPhoto(item.id, 'checkin', `Bukti Masuk: ${item.employeeName} (${item.date})`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {loadingPhotoId === `${item.id}-checkin` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                              Masuk
                            </button>
                          )}
                          {item.hasCheckOutPhoto && (
                            <button
                              disabled={loadingPhotoId === `${item.id}-checkout`}
                              onClick={() => handlePreviewPhoto(item.id, 'checkout', `Bukti Pulang: ${item.employeeName} (${item.date})`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {loadingPhotoId === `${item.id}-checkout` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                              Pulang
                            </button>
                          )}
                          {item.hasAttachment && (
                            <button
                              disabled={loadingPhotoId === `${item.id}-attachment`}
                              onClick={() => handlePreviewPhoto(item.id, 'attachment', `Bukti Izin: ${item.employeeName} (${item.date})`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {loadingPhotoId === `${item.id}-attachment` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                              Lampiran
                            </button>
                          )}
                          {!item.hasCheckInPhoto && !item.hasCheckOutPhoto && !item.hasAttachment && (
                            <span className="text-slate-400 text-xs italic">Tidak ada bukti</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-right">
                        <button
                          onClick={() => handleDeleteAttendance(item.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Presensi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-4">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-slate-500 text-sm font-medium">Mengambil data rekap presensi...</p>
                </div>
              ) : (
                <>
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-bold text-base">
                    Tidak ada data presensi untuk filter yang dipilih
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Silakan atur ulang tanggal, bulan, atau nama karyawan pada filter di atas.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Modal Preview Bukti */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base md:text-lg pr-4 truncate">
                {previewImage.title}
              </h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative aspect-video sm:aspect-square bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200">
              <img
                src={previewImage.url}
                alt="Bukti Kehadiran"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setPreviewImage(null)}
                className="bg-slate-900 text-white hover:bg-slate-800 px-5 h-10 rounded-xl cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
