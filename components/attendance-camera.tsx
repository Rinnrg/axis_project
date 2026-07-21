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

      {/* Backdrop & Center Container */}
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
        
        {/* Responsive Camera Card */}
        <div className="w-full max-w-lg bg-slate-950/95 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {type === 'checkin' ? '📍 Presensi Masuk' : '👋 Presensi Pulang'}
              </h2>
              <p className="text-xs text-slate-400">Verifikasi wajah diperlukan</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors touch-manipulation"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video / Camera Frame (Unified aspect-video 16:9 to match camera stream) */}
          <div className="relative bg-slate-900 overflow-hidden ring-1 ring-white/10 rounded-2xl aspect-video shadow-inner">
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

            {/* Face guide oval */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-[45%] sm:w-[160px]" style={{ aspectRatio: '220/280' }}>
                <svg viewBox="0 0 220 280" className="absolute inset-0 w-full h-full">
                  <ellipse
                    cx="110" cy="140" rx="100" ry="130"
                    fill="none" strokeWidth="3"
                    stroke={faceDetected ? '#10b981' : 'rgba(255,255,255,0.3)'}
                    strokeDasharray={faceDetected ? '0' : '10 5'}
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
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-white/80 text-xs text-center px-4">
                  {!libraryReady
                    ? 'Memuat library...'
                    : !modelsLoaded
                      ? 'Memuat model AI...'
                      : 'Memulai kamera...'}
                </p>
              </div>
            )}
          </div>

          {/* Compact Instructions */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs space-y-1 text-slate-300">
            <p className="font-semibold text-white">📋 Petunjuk:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400">
              <li>Posisikan wajah Anda di dalam bingkai oval</li>
              <li>Pastikan cahaya cukup dan wajah terlihat jelas</li>
              <li>Tunggu indikator hijau sebelum menekan tombol</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white h-11 text-xs sm:text-sm touch-manipulation"
            >
              Batal
            </Button>
            <Button
              onClick={handleCapture}
              disabled={!faceDetected || isCapturing}
              className={`flex-1 text-white font-semibold transition-all duration-300 h-11 text-xs sm:text-sm touch-manipulation ${
                faceDetected
                  ? accentColor === 'indigo'
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 shadow-lg shadow-indigo-500/30'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800 cursor-not-allowed opacity-50 text-slate-500 border border-slate-700/50'
              }`}
            >
              {isCapturing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memverifikasi...</>
              ) : (
                <><Camera className="w-4 h-4 mr-2" />{faceDetected ? 'Ambil Foto' : 'Mencari Wajah...'}</>
              )}
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}
