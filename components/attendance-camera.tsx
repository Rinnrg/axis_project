'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Script from 'next/script';
import { X, Camera, CheckCircle, AlertCircle, Loader2, ShieldAlert, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    faceapi: any;
  }
}

interface AttendanceCameraProps {
  type: 'checkin' | 'checkout';
  onClose: () => void;
  onSuccess: (timestamp: string, photo?: string) => void;
}

type FaceStatus = 'loading' | 'ready' | 'face_detected' | 'no_face' | 'error';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model';

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */
export function AttendanceCamera({ type, onClose, onSuccess }: AttendanceCameraProps) {
  const videoRef         = useRef<HTMLVideoElement>(null);
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef     = useRef<number | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);

  const [faceStatus,    setFaceStatus]    = useState<FaceStatus>('loading');
  const [isCapturing,   setIsCapturing]   = useState(false);
  const [captureSuccess,setCaptureSuccess]= useState(false);
  const [timestamp,     setTimestamp]     = useState('');
  const [libraryReady,  setLibraryReady]  = useState(false);
  const [modelsLoaded,  setModelsLoaded]  = useState(false);
  const [cameraReady,   setCameraReady]   = useState(false);
  const [errorMsg,      setErrorMsg]      = useState('');
  const [confidence,    setConfidence]    = useState(0);
  const [showTips,      setShowTips]      = useState(false);

  /* --- load models -------------------------------------------------------- */
  const loadModels = useCallback(async () => {
    if (!window.faceapi) return;
    try {
      await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    } catch {
      setFaceStatus('error');
      setErrorMsg('Gagal memuat model AI. Periksa koneksi internet Anda.');
    }
  }, []);

  const handleScriptLoad = useCallback(() => {
    setLibraryReady(true);
    loadModels();
  }, [loadModels]);

  /* --- camera ------------------------------------------------------------- */
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setCameraReady(true);
        }
      } catch (err: unknown) {
        setFaceStatus('error');
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Permission') || msg.includes('NotAllowed')) {
          setErrorMsg('Akses kamera ditolak. Izinkan akses kamera di browser Anda.');
        } else {
          setErrorMsg('Kamera tidak dapat diakses. Pastikan kamera tidak digunakan aplikasi lain.');
        }
      }
    };
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  /* --- detection loop ----------------------------------------------------- */
  useEffect(() => {
    if (!cameraReady || !modelsLoaded) return;
    setFaceStatus('ready');

    const detect = async () => {
      const video   = videoRef.current;
      const overlay = overlayCanvasRef.current;
      if (!video || !overlay || !window.faceapi) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      const displaySize = { width: video.clientWidth, height: video.clientHeight };
      window.faceapi.matchDimensions(overlay, displaySize);

      try {
        const detection = await window.faceapi.detectSingleFace(
          video,
          new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
        );
        const ctx = overlay.getContext('2d');
        ctx?.clearRect(0, 0, overlay.width, overlay.height);

        if (detection) {
          setConfidence(Math.round((detection.score ?? 0) * 100));
          setFaceStatus('face_detected');
          const resized = window.faceapi.resizeResults(detection, displaySize);
          window.faceapi.draw.drawDetections(overlay, [resized]);
        } else {
          setFaceStatus('no_face');
          setConfidence(0);
        }
      } catch { /* continue */ }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [cameraReady, modelsLoaded]);

  /* --- capture ------------------------------------------------------------ */
  const handleCapture = async () => {
    if (faceStatus !== 'face_detected' || !videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Mirror the captured image to match the video preview scale-x-[-1]
      ctx?.translate(canvas.width, 0);
      ctx?.scale(-1, 1);
      ctx?.drawImage(video, 0, 0);

      await new Promise(res => setTimeout(res, 600));

      const timeString = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
      
      // Convert to WebP format with 0.8 quality
      const photoDataUrl = canvas.toDataURL('image/webp', 0.8);

      setTimestamp(timeString);
      setCaptureSuccess(true);
      setTimeout(() => { onSuccess(timeString, photoDataUrl); onClose(); }, 2200);
    } catch {
      setErrorMsg('Gagal mengambil foto. Silakan coba lagi.');
    } finally {
      setIsCapturing(false);
    }
  };

  /* ======================================================================== */
  /*  SUCCESS SCREEN                                                           */
  /* ======================================================================== */
  if (captureSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-sm w-full text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-60" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-full">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {type === 'checkin' ? 'Check-In' : 'Check-Out'} Berhasil!
            </h2>
            <p className="text-slate-500 mt-1 text-sm">Wajah berhasil diverifikasi</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4">
            <p className="text-3xl font-mono font-bold text-emerald-700">{timestamp}</p>
            <p className="text-xs text-emerald-600 mt-1">Waktu Tercatat</p>
          </div>
        </div>
      </div>
    );
  }

  /* ======================================================================== */
  /*  ERROR SCREEN                                                             */
  /* ======================================================================== */
  if (faceStatus === 'error') {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-sm w-full text-center space-y-5 shadow-2xl">
          <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mx-auto">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Terjadi Kesalahan</h2>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">{errorMsg}</p>
          </div>
          <Button onClick={onClose} className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12">
            Tutup
          </Button>
        </div>
      </div>
    );
  }

  /* ======================================================================== */
  /*  STATUS HELPERS                                                           */
  /* ======================================================================== */
  const isLoading   = faceStatus === 'loading' || faceStatus === 'ready';
  const faceDetected = faceStatus === 'face_detected';

  const accentColor = type === 'checkin' ? 'indigo' : 'emerald';

  const statusBadge = () => {
    if (isLoading) return (
      <div className="flex items-center gap-1.5 bg-slate-800/70 px-3 py-1.5 rounded-full border border-slate-600 backdrop-blur">
        <Loader2 className="w-3.5 h-3.5 text-slate-300 animate-spin flex-shrink-0" />
        <span className="text-xs font-medium text-slate-300 whitespace-nowrap">
          {!libraryReady ? 'Memuat library...' : !modelsLoaded ? 'Memuat model AI...' : 'Memulai kamera...'}
        </span>
      </div>
    );
    if (faceDetected) return (
      <div className="flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500 backdrop-blur">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
        <span className="text-xs font-medium text-emerald-300 whitespace-nowrap">
          Wajah Terdeteksi {confidence > 0 && `(${confidence}%)`}
        </span>
      </div>
    );
    return (
      <div className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500 backdrop-blur">
        <AlertCircle className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
        <span className="text-xs font-medium text-amber-300 whitespace-nowrap">Posisikan wajah di frame</span>
      </div>
    );
  };

  /* ======================================================================== */
  /*  MAIN RENDER                                                              */
  /* ======================================================================== */
  return (
    <>
      {/* Load face-api.js CDN */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/dist/face-api.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={() => {
          setFaceStatus('error');
          setErrorMsg('Gagal memuat library deteksi wajah. Periksa koneksi internet Anda.');
        }}
      />

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/90 z-50 flex flex-col backdrop-blur-sm overflow-y-auto">

        {/* ---- MOBILE: top bar ---- */}
        <div className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-3 sm:hidden">
          <div>
            <h2 className="text-base font-bold text-white">
              {type === 'checkin' ? '📍 Presensi Masuk' : '👋 Presensi Pulang'}
            </h2>
            <p className="text-xs text-white/50">Verifikasi wajah diperlukan</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors touch-manipulation"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ---- CENTER CONTENT (desktop: centered, mobile: full width) ---- */}
        <div className="flex-1 flex items-start sm:items-center justify-center sm:p-4">
          <div className="w-full sm:max-w-2xl space-y-3 sm:space-y-4">

            {/* Desktop header */}
            <div className="hidden sm:flex items-center justify-between px-0">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {type === 'checkin' ? '📍 Presensi Masuk' : '👋 Presensi Pulang'}
                </h2>
                <p className="text-sm text-white/50 mt-0.5">Verifikasi wajah diperlukan</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors"
                aria-label="Tutup kamera"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Video container */}
            {/* Mobile: full-width, 4:3 aspect | Desktop: 16:9 */}
            <div className="relative bg-black overflow-hidden ring-1 ring-white/10
                            sm:rounded-2xl sm:aspect-video
                            aspect-[4/3] rounded-none sm:rounded-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />

              {/* Overlay canvas (face-api drawings) */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none"
              />
              {/* Hidden capture canvas */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Face guide oval — scales with container */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-[38%] sm:w-[220px]" style={{ aspectRatio: '220/280' }}>
                  <svg viewBox="0 0 220 280" className="absolute inset-0 w-full h-full">
                    <ellipse
                      cx="110" cy="140" rx="100" ry="130"
                      fill="none" strokeWidth="3"
                      stroke={faceDetected ? '#10b981' : 'rgba(255,255,255,0.35)'}
                      strokeDasharray={faceDetected ? '0' : '12 6'}
                      className="transition-all duration-500"
                    />
                    <path d="M 20 60 Q 10 10 60 10"   fill="none" strokeWidth="4" stroke="#06b6d4" strokeLinecap="round" />
                    <path d="M 200 60 Q 210 10 160 10" fill="none" strokeWidth="4" stroke="#06b6d4" strokeLinecap="round" />
                    <path d="M 20 220 Q 10 270 60 270" fill="none" strokeWidth="4" stroke="#06b6d4" strokeLinecap="round" />
                    <path d="M 200 220 Q 210 270 160 270" fill="none" strokeWidth="4" stroke="#06b6d4" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Status badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2">
                {statusBadge()}
              </div>

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400 animate-spin" />
                  <p className="text-white/80 text-sm text-center px-4">
                    {!libraryReady
                      ? 'Memuat library face-api.js...'
                      : !modelsLoaded
                        ? 'Memuat model AI deteksi wajah...'
                        : 'Memulai kamera...'}
                  </p>
                </div>
              )}
            </div>

            {/* ---- MOBILE tip strip (collapsed by default) ---- */}
            <div className="sm:hidden px-4">
              <button
                onClick={() => setShowTips(v => !v)}
                className="flex items-center gap-2 text-white/60 text-xs mb-2 touch-manipulation"
              >
                <Info className="w-3.5 h-3.5" />
                {showTips ? 'Sembunyikan petunjuk' : 'Lihat petunjuk penggunaan'}
              </button>
              {showTips && (
                <div className="bg-white/8 border border-white/15 rounded-xl p-3 text-white text-xs space-y-1">
                  <ul className="list-disc list-inside space-y-0.5 text-white/70">
                    <li>Posisikan wajah di dalam oval</li>
                    <li>Pastikan pencahayaan cukup</li>
                    <li>Tatap langsung ke kamera</li>
                    <li>Tunggu indikator hijau</li>
                  </ul>
                </div>
              )}
            </div>

            {/* ---- DESKTOP instructions ---- */}
            <div className="hidden sm:block bg-white/8 backdrop-blur border border-white/15 rounded-xl p-4 text-white text-sm space-y-2">
              <p className="font-semibold text-white/90">📋 Petunjuk:</p>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                <li>Posisikan wajah Anda di dalam oval</li>
                <li>Pastikan pencahayaan cukup — hindari backlight</li>
                <li>Tatap langsung ke kamera</li>
                <li>Tunggu indikator hijau sebelum klik tombol</li>
                <li>Tidak ada foto yang diunggah ke server</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 px-4 sm:px-0 pb-safe-bottom pb-4 sm:pb-0">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white
                           h-12 sm:h-10 text-sm sm:text-sm touch-manipulation"
              >
                Batal
              </Button>
              <Button
                onClick={handleCapture}
                disabled={!faceDetected || isCapturing}
                className={`flex-1 text-white font-semibold transition-all duration-300
                             h-12 sm:h-10 text-sm touch-manipulation ${
                  faceDetected
                    ? accentColor === 'indigo'
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 shadow-lg shadow-indigo-500/30'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                {isCapturing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memverifikasi...</>
                ) : (
                  <><Camera className="w-4 h-4 mr-2" />{faceDetected ? 'Konfirmasi Presensi' : 'Menunggu Wajah...'}</>
                )}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
