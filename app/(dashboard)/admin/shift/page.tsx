'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Clock, Save, RefreshCw, Loader2, Sun, Moon, CheckCircle2, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

interface ShiftConfig {
  shift1Name: string;
  shift1Start: string;
  shift1End: string;
  shift2Name: string;
  shift2Start: string;
  shift2End: string;
}

export default function AdminShiftPage() {
  const [config, setConfig] = useState<ShiftConfig>({
    shift1Name: 'Shift 1 (Pagi)',
    shift1Start: '07:00',
    shift1End: '15:00',
    shift2Name: 'Shift 2 (Siang/Malam)',
    shift2Start: '15:00',
    shift2End: '23:00',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchShiftConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/shift-config');
      const data = await res.json();
      if (res.ok && data.config) {
        setConfig({
          shift1Name: data.config.shift1Name || 'Shift 1 (Pagi)',
          shift1Start: data.config.shift1Start || '07:00',
          shift1End: data.config.shift1End || '15:00',
          shift2Name: data.config.shift2Name || 'Shift 2 (Siang/Malam)',
          shift2Start: data.config.shift2Start || '15:00',
          shift2End: data.config.shift2End || '23:00',
        });
      }
    } catch (err) {
      console.error('Failed to load shift config', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/shift-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pengaturan shift');

      Swal.fire({
        title: 'Berhasil Disimpan!',
        text: 'Jam kerja Shift 1 dan Shift 2 telah diperbarui.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' },
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err.message || 'Terjadi kesalahan saat menyimpan data.',
        icon: 'error',
        customClass: { popup: 'rounded-2xl' },
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-indigo-600" />
        <p className="text-sm font-medium">Memuat pengaturan shift kerja...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-8 h-8 text-indigo-600" />
            Pengaturan Shift Karyawan
          </h1>
          <p className="text-slate-500 text-sm">
            Atur jam masuk (check-in) dan jam keluar (check-out) untuk Shift 1 dan Shift 2.
          </p>
        </div>

        <button
          onClick={fetchShiftConfig}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 bg-white rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Muat Ulang</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Main Grid for Shift 1 & Shift 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* SHIFT 1 CARD */}
          <div className="bg-white rounded-3xl border border-amber-200/80 shadow-lg shadow-amber-500/5 overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Sun className="w-6 h-6 text-amber-100" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-amber-100 uppercase tracking-wider backdrop-blur-md">
                      Pagi / Siang
                    </span>
                    <h2 className="text-xl font-bold mt-0.5">Shift 1</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-amber-100/90 font-medium">Status Jam</p>
                  <p className="text-sm font-extrabold">{config.shift1Start} - {config.shift1End}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Nama Shift 1 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Display Shift 1
                </label>
                <input
                  type="text"
                  value={config.shift1Name}
                  onChange={(e) => setConfig({ ...config, shift1Name: e.target.value })}
                  placeholder="e.g. Shift 1 (Pagi)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
                  required
                />
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Jam Check-In (Masuk)
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={config.shift1Start}
                      onChange={(e) => setConfig({ ...config, shift1Start: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-mono font-bold text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Check-in melebihi jam ini dicatat <span className="text-amber-600 font-semibold">TELAT</span>.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Jam Check-Out (Pulang)
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={config.shift1End}
                      onChange={(e) => setConfig({ ...config, shift1End: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-mono font-bold text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Batas akhir jam shift 1.</p>
                </div>
              </div>
            </div>
          </div>

          {/* SHIFT 2 CARD */}
          <div className="bg-white rounded-3xl border border-indigo-200/80 shadow-lg shadow-indigo-500/5 overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-900 p-6 text-white relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Moon className="w-6 h-6 text-indigo-200" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-indigo-100 uppercase tracking-wider backdrop-blur-md">
                      Siang / Malam
                    </span>
                    <h2 className="text-xl font-bold mt-0.5">Shift 2</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-indigo-200/90 font-medium">Status Jam</p>
                  <p className="text-sm font-extrabold">{config.shift2Start} - {config.shift2End}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Nama Shift 2 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Display Shift 2
                </label>
                <input
                  type="text"
                  value={config.shift2Name}
                  onChange={(e) => setConfig({ ...config, shift2Name: e.target.value })}
                  placeholder="e.g. Shift 2 (Siang/Malam)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  required
                />
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Jam Check-In (Masuk)
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={config.shift2Start}
                      onChange={(e) => setConfig({ ...config, shift2Start: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-mono font-bold text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Check-in melebihi jam ini dicatat <span className="text-amber-600 font-semibold">TELAT</span>.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Jam Check-Out (Pulang)
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={config.shift2End}
                      onChange={(e) => setConfig({ ...config, shift2End: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-mono font-bold text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Batas akhir jam shift 2.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-bold rounded-2xl shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Simpan Jam Shift</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
