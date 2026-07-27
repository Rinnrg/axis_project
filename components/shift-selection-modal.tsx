'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Clock, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

interface ShiftConfig {
  shift1Name: string;
  shift1Start: string;
  shift1End: string;
  shift2Name: string;
  shift2Start: string;
  shift2End: string;
}

interface ShiftSelectionModalProps {
  userId: string;
  onShiftSelected: (shift: string, shiftName: string) => void;
  onClose?: () => void;
  isDismissable?: boolean;
}

export function ShiftSelectionModal({
  userId,
  onShiftSelected,
  onClose,
  isDismissable = false,
}: ShiftSelectionModalProps) {
  const [selectedShift, setSelectedShift] = useState<'SHIFT_1' | 'SHIFT_2'>('SHIFT_1');
  const [config, setConfig] = useState<ShiftConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadShiftConfig() {
      try {
        const res = await fetch('/api/shift-config');
        const data = await res.json();
        if (res.ok && data.config) {
          setConfig(data.config);
        }
      } catch (err) {
        console.error('Failed to load shift config', err);
      } finally {
        setLoading(false);
      }
    }
    loadShiftConfig();
  }, []);

  const handleSubmit = async () => {
    if (!userId || !selectedShift) return;
    setSubmitting(true);

    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const todayDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const res = await fetch('/api/attendance/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          shift: selectedShift,
          date: todayDateStr,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pilihan shift');

      Swal.fire({
        title: 'Shift Berhasil Dipilih!',
        text: `Anda telah memilih ${data.shiftName || selectedShift} untuk hari ini.`,
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' },
      });

      onShiftSelected(selectedShift, data.shiftName || selectedShift);
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err.message || 'Terjadi kesalahan.',
        icon: 'error',
        customClass: { popup: 'rounded-2xl' },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const shift1Name = config?.shift1Name || 'Shift 1 (Pagi)';
  const shift1Start = config?.shift1Start || '07:00';
  const shift1End = config?.shift1End || '15:00';

  const shift2Name = config?.shift2Name || 'Shift 2 (Siang/Malam)';
  const shift2Start = config?.shift2Start || '15:00';
  const shift2End = config?.shift2End || '23:00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 p-6 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Clock className="w-32 h-32 text-white" />
          </div>

          <div className="relative z-10 space-y-1">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/20 text-indigo-100 uppercase tracking-wider backdrop-blur-md inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Presensi Harian
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight">Pilih Shift Kerja Hari Ini</h2>
            <p className="text-xs text-indigo-200 font-medium">{todayStr}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Silakan pilih jadwal shift kerja Anda untuk hari ini sebelum melakukan absensi masuk.
          </p>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
              <span className="text-xs">Memuat pilihan shift...</span>
            </div>
          ) : (
            <div className="space-y-3">
              
              {/* SHIFT 1 CHOICE */}
              <div
                onClick={() => setSelectedShift('SHIFT_1')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                  selectedShift === 'SHIFT_1'
                    ? 'border-amber-500 bg-amber-50/50 shadow-md shadow-amber-500/10'
                    : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    selectedShift === 'SHIFT_1' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <Sun className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                      {shift1Name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono font-extrabold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                        {shift1Start} - {shift1End}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Shift Pagi</span>
                    </div>
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedShift === 'SHIFT_1'
                    ? 'border-amber-500 bg-amber-500 text-white scale-110'
                    : 'border-slate-300 bg-white'
                }`}>
                  {selectedShift === 'SHIFT_1' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </div>

              {/* SHIFT 2 CHOICE */}
              <div
                onClick={() => setSelectedShift('SHIFT_2')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                  selectedShift === 'SHIFT_2'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-500/10'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    selectedShift === 'SHIFT_2' ? 'bg-gradient-to-br from-indigo-600 to-indigo-900 text-white shadow-sm' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    <Moon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                      {shift2Name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono font-extrabold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                        {shift2Start} - {shift2End}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Shift Siang/Malam</span>
                    </div>
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedShift === 'SHIFT_2'
                    ? 'border-indigo-600 bg-indigo-600 text-white scale-110'
                    : 'border-slate-300 bg-white'
                }`}>
                  {selectedShift === 'SHIFT_2' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </div>

            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            {isDismissable && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="button"
              disabled={submitting || loading}
              onClick={handleSubmit}
              className={`py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-bold rounded-2xl shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                isDismissable && onClose ? 'w-2/3' : 'w-full'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Shift...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Konfirmasi Pilihan Shift</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
