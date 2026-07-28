'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';
import {
  Download,
  Calendar,
  Search,
  AlertCircle,
  Eye,
  X,
  Loader2,
  Trash2,
  FileSpreadsheet,
  RotateCcw,
  Printer,
  FileText,
  Users,
  ListFilter,
  CheckCircle,
  BarChart2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function RekapPage() {
  const [filterType, setFilterType] = useState<'month' | 'date' | 'year' | 'all'>('month');
  const [showStats, setShowStats] = useState(false);
  
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'rekap' | 'log'>('rekap');
  
  const [rekap, setRekap] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [loadingPhotoId, setLoadingPhotoId] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Fetch rekap data from API based on filter mode
  const fetchRekap = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/api/admin/rekap';
      if (filterType === 'date' && selectedDate) {
        url += `?date=${selectedDate}`;
      } else if (filterType === 'year' && selectedYear) {
        url += `?year=${selectedYear}`;
      } else if (filterType === 'all') {
        url += `?month=all`;
      } else {
        url += `?month=${month}`;
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
  }, [filterType, selectedDate, month, selectedYear]);

  useEffect(() => {
    fetchRekap();
    const interval = setInterval(fetchRekap, 2 * 60 * 60 * 1000); // 2-hour polling
    return () => clearInterval(interval);
  }, [fetchRekap]);

  // Filter attendance records on client side
  const filteredAttendance = rekap.filter((a) => {
    if (filterType === 'date' && selectedDate && a.date !== selectedDate) return false;
    if (!employeeFilter) return true;
    return a.employeeName.toLowerCase().includes(employeeFilter.toLowerCase());
  });

  // Calculate Employee-level Summary (Nama, Jabatan, Hadir, Izin, Sakit, Cuti, Telat)
  const employeeRekapList = employees
    .filter((emp) => {
      if (!employeeFilter) return true;
      return emp.name.toLowerCase().includes(employeeFilter.toLowerCase());
    })
    .map((emp) => {
      const empRecords = filteredAttendance.filter((a) => a.employeeId === emp.id);

      const hadir = empRecords.filter((a) => a.status === 'hadir').length;
      const telat = empRecords.filter((a) => a.status === 'telat').length;
      const izin = empRecords.filter(
        (a) =>
          (a.status === 'izin' || a.permissionType === 'IZIN') &&
          a.permissionType !== 'SAKIT' &&
          a.permissionType !== 'CUTI' &&
          a.permissionStatus !== 'REJECTED'
      ).length;
      const sakit = empRecords.filter(
        (a) => a.permissionType === 'SAKIT' && a.permissionStatus !== 'REJECTED'
      ).length;
      const cuti = empRecords.filter(
        (a) => a.permissionType === 'CUTI' && a.permissionStatus !== 'REJECTED'
      ).length;

      return {
        id: emp.id,
        name: emp.name,
        position: emp.position ? emp.position.charAt(0).toUpperCase() + emp.position.slice(1) : '-',
        hadir,
        izin,
        sakit,
        cuti,
        telat,
      };
    });

  // Totals for employee rekap table footer
  const totalSummary = employeeRekapList.reduce(
    (acc, item) => ({
      hadir: acc.hadir + item.hadir,
      izin: acc.izin + item.izin,
      sakit: acc.sakit + item.sakit,
      cuti: acc.cuti + item.cuti,
      telat: acc.telat + item.telat,
    }),
    { hadir: 0, izin: 0, sakit: 0, cuti: 0, telat: 0 }
  );

  // Overall stats cards
  const stats = {
    total: filteredAttendance.length,
    hadir: filteredAttendance.filter((a) => a.status === 'hadir').length,
    telat: filteredAttendance.filter((a) => a.status === 'telat').length,
    izinApproved: filteredAttendance.filter(
      (a) => (a.status === 'izin' || a.permissionType === 'IZIN') && a.permissionStatus !== 'REJECTED'
    ).length,
    sakit: filteredAttendance.filter(
      (a) => a.permissionType === 'SAKIT' && a.permissionStatus !== 'REJECTED'
    ).length,
    cuti: filteredAttendance.filter(
      (a) => a.permissionType === 'CUTI' && a.permissionStatus !== 'REJECTED'
    ).length,
    alpha: filteredAttendance.filter((a) => a.status === 'alpha').length,
  };

  // Flatten records for log view
  const flatRecords = filteredAttendance.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get formatted period description text
  const getPeriodeText = () => {
    if (filterType === 'date' && selectedDate) {
      const [y, m, d] = selectedDate.split('-');
      const dateObj = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d)));
      return `Tanggal ${dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })}`;
    }
    if (filterType === 'month' && month && month !== 'all') {
      const [y, m] = month.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return `Bulan ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
    }
    if (filterType === 'year' && selectedYear) {
      return `Tahun ${selectedYear}`;
    }
    return 'Semua Data';
  };

  // Excel export
  const buildExcelRows = (records: any[]) => {
    return records.map((item) => {
      const isHadir = item.status === 'hadir';
      const isTelat = item.status === 'telat';
      const permType = (item.permissionType || '').toUpperCase();
      const isIzin = permType === 'IZIN' || (item.status === 'izin' && !permType);
      const isSakit = permType === 'SAKIT';
      const isCuti = permType === 'CUTI';

      const pos = item.employee?.position || item.position || '-';
      const formattedPos = pos !== '-' ? pos.charAt(0).toUpperCase() + pos.slice(1) : '-';

      return {
        Tanggal: new Date(item.date).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        }),
        Nama: item.employeeName,
        Nomor: item.employee?.phone || item.phone || '-',
        Jabatan: formattedPos,
        Shift: item.shiftName || item.shift || '-',
        Hadir: isHadir ? (item.checkInTime ? `✓ (${item.checkInTime})` : '✓') : '-',
        Izin: isIzin ? '✓' : '-',
        Sakit: isSakit ? '✓' : '-',
        Cuti: isCuti ? '✓' : '-',
        Telat: isTelat ? (item.checkInTime ? `✓ (${item.checkInTime})` : '✓') : '-',
      };
    });
  };

  const downloadExcel = async (records: any[], filename: string) => {
    try {
      const XLSX = await import('xlsx');
      const rows = buildExcelRows(records);
      const ws = XLSX.utils.json_to_sheet(rows);

      ws['!cols'] = [
        { wch: 28 },
        { wch: 25 },
        { wch: 18 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 18 },
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
        customClass: { popup: 'rounded-2xl' },
      });
    } catch (err: any) {
      console.error('Export error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Export Gagal',
        text: 'Terjadi kesalahan saat memproses file Excel.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' },
      });
    }
  };

  const handleExportMonth = () => {
    downloadExcel(flatRecords, `Rekap_Presensi_${getPeriodeText().replace(/ /g, '_')}.xlsx`);
  };

  const handleResetFilters = () => {
    const d = new Date();
    setFilterType('month');
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDate('');
    setSelectedYear(String(d.getFullYear()));
    setEmployeeFilter('');
  };

  // Trigger Print PDF Document
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      Swal.fire({
        icon: 'error',
        title: 'Popup Diblokir',
        text: 'Silakan izinkan popup browser Anda untuk mencetak PDF.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' },
      });
      return;
    }

    const currentDateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const rowsHtml = employeeRekapList
      .map(
        (emp, idx) => `
      <tr>
        <td style="text-align: center; color: #000000;">${idx + 1}</td>
        <td style="font-weight: bold; color: #000000;">${emp.name}</td>
        <td style="color: #000000;">${emp.position}</td>
        <td style="text-align: center; font-weight: bold; color: #000000;">${emp.hadir}</td>
        <td style="text-align: center; font-weight: bold; color: #000000;">${emp.izin}</td>
        <td style="text-align: center; font-weight: bold; color: #000000;">${emp.sakit}</td>
        <td style="text-align: center; font-weight: bold; color: #000000;">${emp.cuti}</td>
        <td style="text-align: center; font-weight: bold; color: #000000;">${emp.telat}</td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Laporan Rekap Presensi Karyawan</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          * {
            box-sizing: border-box;
            color: #000000 !important;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #000000;
            margin: 0;
            padding: 10px;
            font-size: 11px;
            background: #ffffff;
            position: relative;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-watermark {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.05;
            background-image: url('/axis.svg');
            background-repeat: repeat;
            background-size: 120px 120px;
            background-position: center;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000000;
            padding-bottom: 12px;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #000000;
          }
          .header h2 {
            margin: 4px 0 2px 0;
            font-size: 15px;
            font-weight: bold;
            color: #000000;
            letter-spacing: 0.5px;
          }
          .header .sub-text {
            margin: 0;
            font-size: 10px;
            color: #333333;
            font-style: italic;
          }
          .meta-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px dashed #000000;
            font-size: 11px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          th, td {
            border: 1px solid #000000;
            padding: 7px 9px;
            text-align: left;
            color: #000000;
          }
          th {
            background-color: #f2f2f2 !important;
            font-weight: bold;
            font-size: 10.5px;
            text-transform: uppercase;
            color: #000000;
          }
          tfoot tr td {
            background-color: #f2f2f2 !important;
            font-weight: bold;
            font-size: 11px;
            border-top: 2px solid #000000;
            color: #000000;
          }
          .signature-section {
            margin-top: 40px;
            page-break-inside: avoid;
          }
          .sig-header {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 15px;
            color: #000000;
          }
          .signatures-grid {
            display: flex;
            justify-content: space-between;
            width: 100%;
          }
          .sig-box {
            width: 45%;
            text-align: left;
          }
          .sig-title {
            font-weight: bold;
            font-size: 11px;
            color: #000000;
            line-height: 1.5;
          }
          .sig-space {
            height: 60px;
          }
          .sig-name {
            font-weight: bold;
            font-size: 12px;
            text-decoration: underline;
            color: #000000;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="bg-watermark"></div>
        
        <div class="header">
          <h1>LAPORAN REKAP PRESENSI KARYAWAN</h1>
          <h2>CH CLUB HOUSE</h2>
          <p class="sub-text">Sistem Presensi & Manajemen Kehadiran Operational</p>
          <div class="meta-info">
            <span>Periode: ${getPeriodeText()}</span>
            <span>Tanggal Cetak: ${currentDateStr}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">No</th>
              <th>Nama Karyawan</th>
              <th>Jabatan</th>
              <th style="width: 50px; text-align: center;">Hadir</th>
              <th style="width: 50px; text-align: center;">Izin</th>
              <th style="width: 50px; text-align: center;">Sakit</th>
              <th style="width: 50px; text-align: center;">Cuti</th>
              <th style="width: 120px; text-align: center;">Keterangan (Telat)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right; padding-right: 15px;">TOTAL KELURUHAN</td>
              <td style="text-align: center;">${totalSummary.hadir}</td>
              <td style="text-align: center;">${totalSummary.izin}</td>
              <td style="text-align: center;">${totalSummary.sakit}</td>
              <td style="text-align: center;">${totalSummary.cuti}</td>
              <td style="text-align: center;">${totalSummary.telat}</td>
            </tr>
          </tfoot>
        </table>

        <div class="signature-section">
          <div class="sig-header">Mengetahui,</div>
          <div class="signatures-grid">
            <div class="sig-box">
              <div class="sig-title">
                Sidoarjo, ${currentDateStr}<br/>
                Manager
              </div>
              <div class="sig-space"></div>
              <div class="sig-name">Rino Raihan G.</div>
            </div>
            <div class="sig-box">
              <div class="sig-title">
                <br/>
                Ast Manager
              </div>
              <div class="sig-space"></div>
              <div class="sig-name">Aldan Nur Sajidan</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Preview photo
  const handlePreviewPhoto = async (
    id: string,
    type: 'checkin' | 'checkout' | 'attachment',
    title: string
  ) => {
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
          customClass: { popup: 'rounded-2xl' },
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Gambar',
        text: err.message || 'Terjadi kesalahan.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' },
      });
    } finally {
      setLoadingPhotoId(null);
    }
  };

  // Delete attendance record
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
      customClass: { popup: 'rounded-2xl' },
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
        customClass: { popup: 'rounded-2xl' },
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err.message || 'Gagal menghapus data presensi.',
        icon: 'error',
        customClass: { popup: 'rounded-2xl' },
      });
    }
  };

  const getStatusBadge = (
    status: string,
    permissionType?: string | null,
    permissionStatus?: string | null
  ) => {
    if (status === 'izin' && permissionType) {
      if (permissionStatus === 'REJECTED')
        return 'bg-slate-100 text-slate-500 border border-slate-300 line-through';
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

  const getStatusLabel = (
    status: string,
    permissionType?: string | null,
    permissionStatus?: string | null
  ) => {
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

  const formatPosition = (pos: string | null) => {
    if (!pos) return '-';
    return pos.charAt(0).toUpperCase() + pos.slice(1);
  };

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Rekap Presensi Karyawan</h1>
            <p className="text-slate-600 mt-1 text-sm">
              Kelola, saring per tanggal/bulan/tahun, cetak laporan PDF, dan export data presensi karyawan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowStats(v => !v)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span>{showStats ? 'Sembunyikan Ringkasan' : 'Tampilkan Ringkasan'}</span>
              {showStats
                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            <Button
              onClick={() => setShowPdfModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              Cetak Laporan PDF
            </Button>

            {loading && (
              <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat data...
              </div>
            )}
          </div>
        </div>

        {/* Statistics (Hidden by default) */}
        {showStats && (
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
        )}

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-600" />
              Filter Data Presensi ({getPeriodeText()})
            </h2>

            {(selectedDate || employeeFilter || month === 'all' || filterType !== 'month') && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filter
              </button>
            )}
          </div>

          {/* Filter Mode Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
            <span className="text-xs font-bold text-slate-600 uppercase mr-2">Mode Filter:</span>
            <button
              onClick={() => setFilterType('date')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'date'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Per Tanggal
            </button>
            <button
              onClick={() => setFilterType('month')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'month'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Per Bulan
            </button>
            <button
              onClick={() => setFilterType('year')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'year'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Per Tahun
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua Data
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
            
            {/* Input Dynamic based on Filter Mode */}
            {filterType === 'date' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilih Tanggal
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
            )}

            {filterType === 'month' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilih Bulan
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="month"
                    value={month === 'all' ? '' : month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {filterType === 'year' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilih Tahun
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                      <option key={y} value={y}>
                        Tahun {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {filterType === 'all' && (
              <div className="space-y-1.5 flex items-end">
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-700 w-full">
                  Menampilkan seluruh data tanpa batasan periode.
                </div>
              </div>
            )}

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

            {/* Export & Action Buttons */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Aksi Laporan
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleExportMonth}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  title="Export Excel Rekap"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Excel
                </button>
                <button
                  onClick={() => setShowPdfModal(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Prinj PDF Laporan Rekap"
                >
                  <Printer className="w-4 h-4" />
                  Print PDF
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

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 flex-wrap w-full">
            <button
              onClick={() => setActiveTab('rekap')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'rekap'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Tabel Rekap Per Karyawan
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'log'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              Log Presensi Harian ({flatRecords.length})
            </button>
          </div>
        </div>

        {/* TAB 1: Tabel Rekap Per Karyawan (Nama, Jabatan, Hadir, Izin, Sakit, Cuti, Telat + Total) */}
        {activeTab === 'rekap' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
            {!loading && employeeRekapList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-12">No</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Nama</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Jabatan</th>
                      <th className="px-5 py-3.5 text-center text-xs font-bold text-emerald-700 uppercase tracking-wider">Hadir</th>
                      <th className="px-5 py-3.5 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Izin</th>
                      <th className="px-5 py-3.5 text-center text-xs font-bold text-rose-700 uppercase tracking-wider">Sakit</th>
                      <th className="px-5 py-3.5 text-center text-xs font-bold text-violet-700 uppercase tracking-wider">Cuti</th>
                      <th className="px-5 py-3.5 text-center text-xs font-bold text-amber-700 uppercase tracking-wider">Keterangan (Telat)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {employeeRekapList.map((emp, idx) => (
                      <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4 text-xs text-center text-slate-500 font-bold">
                          {idx + 1}
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-900">
                          {emp.name}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-700 font-semibold">
                          <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-[11px] font-bold uppercase">
                            {emp.position}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-emerald-700 text-sm">
                          {emp.hadir}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-blue-700 text-sm">
                          {emp.izin}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-rose-700 text-sm">
                          {emp.sakit}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-violet-700 text-sm">
                          {emp.cuti}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-amber-700 text-sm">
                          {emp.telat}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-extrabold text-slate-900">
                    <tr>
                      <td colSpan={3} className="px-5 py-4 text-right uppercase tracking-wider text-xs">
                        TOTAL REKAP
                      </td>
                      <td className="px-5 py-4 text-center text-emerald-800 text-base">
                        {totalSummary.hadir}
                      </td>
                      <td className="px-5 py-4 text-center text-blue-800 text-base">
                        {totalSummary.izin}
                      </td>
                      <td className="px-5 py-4 text-center text-rose-800 text-base">
                        {totalSummary.sakit}
                      </td>
                      <td className="px-5 py-4 text-center text-violet-800 text-base">
                        {totalSummary.cuti}
                      </td>
                      <td className="px-5 py-4 text-center text-amber-800 text-base">
                        {totalSummary.telat}
                      </td>
                    </tr>
                  </tfoot>
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
                      Tidak ada data karyawan ditemukan
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Log Presensi Harian */}
        {activeTab === 'log' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
            {!loading && flatRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">No</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Karyawan</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Role / Jabatan</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Tanggal</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Shift</th>
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
                            {formatPosition(item.employee?.position || item.position)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                          {new Date(item.date).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            timeZone: 'UTC',
                          })}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                          <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold uppercase">
                            {item.shiftName || item.shift || '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-700 font-mono font-bold">
                          {item.checkInTime || '-'}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-700 font-mono font-bold">
                          {item.checkOutTime || '-'}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${getStatusBadge(
                              item.status,
                              item.permissionType,
                              item.permissionStatus
                            )}`}
                          >
                            {getStatusLabel(item.status, item.permissionType, item.permissionStatus)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600 max-w-[180px]">
                          {item.permissionType ? (
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="block font-bold text-[10px] uppercase tracking-wider text-slate-400">
                                  {item.permissionType}
                                </span>
                                {item.permissionStatus === 'REJECTED' && (
                                  <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-bold uppercase">
                                    Ditolak
                                  </span>
                                )}
                                {item.permissionStatus === 'APPROVED' && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[9px] font-bold uppercase">
                                    Disetujui
                                  </span>
                                )}
                              </div>
                              <span className="text-xs leading-relaxed line-clamp-2">
                                {item.permissionReason || '-'}
                              </span>
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
                                onClick={() =>
                                  handlePreviewPhoto(
                                    item.id,
                                    'checkin',
                                    `Bukti Masuk: ${item.employeeName} (${item.date})`
                                  )
                                }
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
                                onClick={() =>
                                  handlePreviewPhoto(
                                    item.id,
                                    'checkout',
                                    `Bukti Pulang: ${item.employeeName} (${item.date})`
                                  )
                                }
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
                                onClick={() =>
                                  handlePreviewPhoto(
                                    item.id,
                                    'attachment',
                                    `Bukti Izin: ${item.employeeName} (${item.date})`
                                  )
                                }
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
                            {!item.hasCheckInPhoto &&
                              !item.hasCheckOutPhoto &&
                              !item.hasAttachment && (
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
                  </>
                )}
              </div>
            )}
          </div>
        )}

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

      {/* Modal Preview Laporan PDF */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">
                  Preview Laporan Rekap Presensi (PDF)
                </h3>
              </div>
              <button
                onClick={() => setShowPdfModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Paper Preview */}
            <div className="p-6 md:p-10 overflow-y-auto flex-1 bg-slate-200/60">
              <div className="bg-white p-8 md:p-12 shadow-md rounded-lg max-w-3xl mx-auto border border-slate-300 font-sans text-slate-900 text-sm space-y-6 relative overflow-hidden">
                
                {/* Background Pattern Watermark */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-[0.05] bg-repeat bg-center z-0"
                  style={{
                    backgroundImage: "url('/axis.svg')",
                    backgroundSize: "120px 120px"
                  }}
                />

                <div className="relative z-10 space-y-6">
                  {/* PDF Title Header */}
                  <div className="text-center border-b-2 border-black pb-4">
                    <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-wider text-black">
                      LAPORAN REKAP PRESENSI KARYAWAN
                    </h1>
                    <h2 className="text-base font-bold text-black mt-1 tracking-wide">
                      CH CLUB HOUSE
                    </h2>
                    <p className="text-[11px] text-slate-700 italic mt-0.5">
                      Sistem Presensi & Manajemen Kehadiran Operational
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-black text-xs font-bold text-black">
                      <span>Periode: <strong>{getPeriodeText()}</strong></span>
                      <span>Tanggal Cetak: <strong>{currentDateFormatted}</strong></span>
                    </div>
                  </div>

                  {/* PDF Rekap Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black text-xs text-black">
                      <thead>
                        <tr className="bg-slate-100 border-b border-black text-black">
                          <th className="border border-black px-3 py-2 text-center w-10">No</th>
                          <th className="border border-black px-3 py-2 text-left">Nama Karyawan</th>
                          <th className="border border-black px-3 py-2 text-left">Jabatan</th>
                          <th className="border border-black px-3 py-2 text-center w-14">Hadir</th>
                          <th className="border border-black px-3 py-2 text-center w-14">Izin</th>
                          <th className="border border-black px-3 py-2 text-center w-14">Sakit</th>
                          <th className="border border-black px-3 py-2 text-center w-14">Cuti</th>
                          <th className="border border-black px-3 py-2 text-center w-28">Keterangan (Telat)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeRekapList.map((emp, idx) => (
                          <tr key={emp.id} className="border-b border-black">
                            <td className="border border-black px-3 py-2 text-center font-semibold text-black">{idx + 1}</td>
                            <td className="border border-black px-3 py-2 font-bold text-black">{emp.name}</td>
                            <td className="border border-black px-3 py-2 text-black">{emp.position}</td>
                            <td className="border border-black px-3 py-2 text-center font-bold text-black">{emp.hadir}</td>
                            <td className="border border-black px-3 py-2 text-center font-bold text-black">{emp.izin}</td>
                            <td className="border border-black px-3 py-2 text-center font-bold text-black">{emp.sakit}</td>
                            <td className="border border-black px-3 py-2 text-center font-bold text-black">{emp.cuti}</td>
                            <td className="border border-black px-3 py-2 text-center font-bold text-black">{emp.telat}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 border-t-2 border-black font-bold text-black">
                          <td colSpan={3} className="border border-black px-3 py-2.5 text-right uppercase">
                            TOTAL KELURUHAN
                          </td>
                          <td className="border border-black px-3 py-2.5 text-center font-bold text-black">{totalSummary.hadir}</td>
                          <td className="border border-black px-3 py-2.5 text-center font-bold text-black">{totalSummary.izin}</td>
                          <td className="border border-black px-3 py-2.5 text-center font-bold text-black">{totalSummary.sakit}</td>
                          <td className="border border-black px-3 py-2.5 text-center font-bold text-black">{totalSummary.cuti}</td>
                          <td className="border border-black px-3 py-2.5 text-center font-bold text-black">{totalSummary.telat}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* PDF Signatures Block */}
                  <div className="pt-6 space-y-4">
                    <p className="font-bold text-xs text-black">Mengetahui,</p>
                    <div className="flex justify-between items-start pt-2">
                      {/* Manager Signature (Left) */}
                      <div className="w-1/2 pr-4">
                        <p className="font-bold text-xs leading-relaxed text-black">
                          Sidoarjo, {currentDateFormatted}<br />
                          Manager
                        </p>
                        <div className="h-16"></div>
                        <p className="font-bold text-xs underline text-black">
                          Rino Raihan G.
                        </p>
                      </div>

                      {/* Ast Manager Signature (Right) */}
                      <div className="w-1/2 pl-4">
                        <p className="font-bold text-xs leading-relaxed text-black">
                          <br />
                          Ast Manager
                        </p>
                        <div className="h-16"></div>
                        <p className="font-bold text-xs underline text-black">
                          Aldan Nur Sajidan
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white">
              <Button
                variant="outline"
                onClick={() => setShowPdfModal(false)}
                className="px-5 rounded-xl cursor-pointer"
              >
                Tutup
              </Button>
              <Button
                onClick={handlePrintPDF}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Cetak / Download PDF
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
