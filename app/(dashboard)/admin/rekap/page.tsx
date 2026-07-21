'use client';

import { useState } from 'react';
import { mockAttendance, mockEmployees } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import {
  Download,
  Calendar,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function RekapPage() {
  const [month, setMonth] = useState('2024-07');
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Filter attendance data
  const filteredAttendance = mockAttendance
    .filter((a) => a.date.startsWith(month))
    .filter((a) => {
      if (!employeeFilter) return true;
      const employee = mockEmployees.find((e) => e.id === a.employeeId);
      return employee?.name
        .toLowerCase()
        .includes(employeeFilter.toLowerCase());
    });

  // Group by employee
  const attendanceByEmployee = mockEmployees.reduce(
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
      { employee: typeof mockEmployees[0]; records: typeof mockAttendance }
    >
  );

  // Calculate statistics
  const stats = {
    total: filteredAttendance.length,
    hadir: filteredAttendance.filter((a) => a.status === 'hadir').length,
    telat: filteredAttendance.filter((a) => a.status === 'telat').length,
    izin: filteredAttendance.filter((a) => a.status === 'izin').length,
    alpha: filteredAttendance.filter((a) => a.status === 'alpha').length,
  };

  // Handle Excel export
  const handleExportMonth = () => {
    // TODO: Implement Excel export using xlsx library
    console.log('Export data untuk bulan:', month);
    alert('Fitur export bulan ini akan diimplementasikan dengan library xlsx');
  };

  const handleExportAll = () => {
    // TODO: Implement Excel export using xlsx library
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rekap Presensi</h1>
          <p className="text-slate-600 mt-2">
            Kelola dan analisis data presensi semua karyawan
          </p>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-5 gap-4">
          {[
            {
              label: 'Total Presensi',
              value: stats.total,
              color: 'slate',
              icon: TrendingUp,
            },
            {
              label: 'Hadir',
              value: stats.hadir,
              color: 'emerald',
              icon: CheckCircle,
            },
            { label: 'Telat', value: stats.telat, color: 'amber' },
            { label: 'Izin', value: stats.izin, color: 'blue' },
            { label: 'Alpha', value: stats.alpha, color: 'red' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-lg p-4`}
            >
              <p className={`text-sm text-${stat.color}-700`}>{stat.label}</p>
              <p className={`text-3xl font-bold text-${stat.color}-900 mt-2`}>
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

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {Object.keys(attendanceByEmployee).length > 0 ? (
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.values(attendanceByEmployee).flatMap((group) =>
                    group.records.map((attendance) => (
                      <tr
                        key={attendance.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
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
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {attendance.checkInTime || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {attendance.checkOutTime || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(attendance.status)}`}
                          >
                            {getStatusLabel(attendance.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">
                Tidak ada data presensi untuk filter yang dipilih
              </p>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Catatan:</strong> Fitur export Excel akan diimplementasikan
            menggunakan library xlsx/sheetjs. Anda dapat mengklik tombol Export
            untuk mengunduh data dalam format Excel.
          </p>
        </div>
      </div>
    </div>
  );
}
