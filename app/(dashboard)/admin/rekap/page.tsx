'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';

export default function RekapPage() {
  const [month, setMonth] = useState('2024-07');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [rekap, setRekap] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Fetch real rekap data from API
  const fetchRekap = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/rekap?month=${month}`);
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
  }, [month]);

  useEffect(() => {
    fetchRekap();
    const interval = setInterval(fetchRekap, 5000); // 5-second polling
    return () => clearInterval(interval);
  }, [fetchRekap]);

  // Filter attendance data on the client side
  const filteredAttendance = rekap.filter((a) => {
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
    izin: filteredAttendance.filter((a) => a.status === 'izin').length,
    alpha: filteredAttendance.filter((a) => a.status === 'alpha').length,
  };

  // Handle Excel export placeholder
  const handleExportMonth = () => {
    console.log('Export data untuk bulan:', month);
    alert('Fitur export bulan ini akan diimplementasikan dengan library xlsx');
  };

  const handleExportAll = () => {
    console.log('Export semua data');
    alert(
      'Fitur export semua data akan diimplementasikan dengan library xlsx'
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      hadir: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      telat: 'bg-amber-100 text-amber-700 border border-amber-200',
      izin: 'bg-blue-100 text-blue-700 border border-blue-200',
      alpha: 'bg-red-100 text-red-700 border border-red-200',
    };
    return styles[status] || styles.alpha;
  };

  const getStatusLabel = (status: string) => {
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
      slate: 'bg-slate-50 border-slate-200 text-slate-700',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      amber: 'bg-amber-50 border-amber-200 text-amber-700',
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      red: 'bg-red-50 border-red-200 text-red-700',
    };
    return styles[color] || styles.slate;
  };

  const getStatTextColors = (color: string) => {
    const styles: Record<string, string> = {
      slate: 'text-slate-900',
      emerald: 'text-emerald-900',
      amber: 'text-amber-900',
      blue: 'text-blue-900',
      red: 'text-red-900',
    };
    return styles[color] || styles.slate;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Rekap Presensi</h1>
            <p className="text-slate-600 mt-2">
              Kelola dan analisis data presensi semua karyawan secara real-time
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memuat data...
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              label: 'Total Presensi',
              value: stats.total,
              color: 'slate',
            },
            {
              label: 'Hadir',
              value: stats.hadir,
              color: 'emerald',
            },
            { label: 'Telat', value: stats.telat, color: 'amber' },
            { label: 'Izin', value: stats.izin, color: 'blue' },
            { label: 'Alpha', value: stats.alpha, color: 'red' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`border rounded-xl p-4 transition-all duration-300 hover:shadow-sm ${getStatCardColors(stat.color)}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider opacity-85">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${getStatTextColors(stat.color)}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters & Export */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Month Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Bulan
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Employee Search */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Cari Karyawan
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama karyawan..."
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Export Buttons */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Export
              </label>
              <div className="flex gap-2">
                <Button
                  onClick={handleExportMonth}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Bulan Ini
                </Button>
                <Button
                  onClick={handleExportAll}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Semua
                </Button>
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          {!loading && Object.keys(attendanceByEmployee).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                      Nama Karyawan
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                      Jam Masuk
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                      Jam Pulang
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                      Bukti Hadir
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.values(attendanceByEmployee).flatMap((group) =>
                    group.records.map((attendance) => (
                      <tr
                        key={attendance.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          {group.employee.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(attendance.date).toLocaleDateString(
                            'id-ID',
                            {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                          {attendance.checkInTime || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                          {attendance.checkOutTime || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(attendance.status)}`}
                          >
                            {getStatusLabel(attendance.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-wrap gap-1.5">
                            {attendance.checkInPhoto && (
                              <button
                                onClick={() => setPreviewImage({
                                  url: attendance.checkInPhoto,
                                  title: `Bukti Masuk: ${group.employee.name} (${attendance.date})`
                                })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Masuk
                              </button>
                            )}
                            {attendance.checkOutPhoto && (
                              <button
                                onClick={() => setPreviewImage({
                                  url: attendance.checkOutPhoto,
                                  title: `Bukti Pulang: ${group.employee.name} (${attendance.date})`
                                })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Pulang
                              </button>
                            )}
                            {attendance.attachment && (
                              <button
                                onClick={() => setPreviewImage({
                                  url: attendance.attachment,
                                  title: `Bukti Izin: ${group.employee.name} (${attendance.date})`
                                })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Lampiran
                              </button>
                            )}
                            {!attendance.checkInPhoto && !attendance.checkOutPhoto && !attendance.attachment && (
                              <span className="text-slate-400 text-xs italic">Tidak ada bukti</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-4">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-slate-500 text-sm">Mengambil data dari server...</p>
                </div>
              ) : (
                <>
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">
                    Tidak ada data presensi untuk filter yang dipilih
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Silakan ubah filter pencarian karyawan atau pilih bulan lainnya.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800 leading-relaxed">
            <strong>Catatan Admin:</strong> Fitur rekap ini membaca data riil dari database. 
            Gambar bukti kehadiran dikompresi menjadi WebP berukuran ringan untuk mempercepat load page dan menghemat bandwidth.
          </p>
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
