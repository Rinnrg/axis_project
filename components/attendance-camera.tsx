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

  // Hook to check if faceapi is already loaded globally on mount (fixes stuck loading issue on open/close)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.faceapi) {
      setLibraryReady(true);
      const isLoaded = window.faceapi.nets.tinyFaceDetector.isLoaded || 
                       (window.faceapi.nets.tinyFaceDetector.params && Object.keys(window.faceapi.nets.tinyFaceDetector.params).length > 0);
      if (isLoaded) {
        setModelsLoaded(true);
      } else {
        loadModels();
      }
    }
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
      const video = videoRef.current;
      if (!video || !window.faceapi) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const detection = await window.faceapi.detectSingleFace(
          video,
          new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
        );

        if (detection) {
          setFaceStatus('face_detected');
        } else {
          setFaceStatus('no_face');
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
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-60" />
            <div className="relative flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {type === 'checkin' ? 'Check-In' : 'Check-Out'} Berhasil!
            </h2>
            <p className="text-slate-400 mt-1 text-xs">Wajah berhasil diverifikasi</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <p className="text-2xl font-mono font-bold text-emerald-400">{timestamp}</p>
            <p className="text-[10px] text-emerald-500 mt-0.5">Waktu Tercatat</p>
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
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
          <div className="flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mx-auto">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Terjadi Kesalahan</h2>
            <p className="text-slate-400 mt-2 text-xs leading-relaxed">{errorMsg}</p>
          </div>
          <Button onClick={onClose} className="w-full bg-white text-black hover:bg-slate-200 h-11 rounded-xl">
            Tutup
          </Button>
        </div>
      </div>
    );
  }

  const isLoading    = faceStatus === 'loading' || faceStatus === 'ready';
  const faceDetected = faceStatus === 'face_detected';
  const accentColor  = type === 'checkin' ? 'indigo' : 'emerald';

  /* ======================================================================== */
  /*  MAIN RENDER                                                              */
  /* ======================================================================== */
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/dist/face-api.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={() => {
          setFaceStatus('error');
          setErrorMsg('Gagal memuat library deteksi wajah. Periksa koneksi internet Anda.');
        }}
      />

      {/* Full-Screen Camera Interface */}
      <div className="fixed inset-0 bg-black z-50 overflow-hidden flex flex-col items-center justify-center">
        
        {/* Full-Screen Video Background */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />

        {/* Hidden capture canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Floating Close Button (Top-Right) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white bg-black/40 hover:bg-black/60 p-3 rounded-full backdrop-blur-md transition-colors touch-manipulation shadow-lg border border-white/10"
          aria-label="Tutup"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Centered Face Guide Oval */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="relative w-[65%] max-w-[280px]" style={{ aspectRatio: '220/280' }}>
            <svg viewBox="0 0 220 280" className="absolute inset-0 w-full h-full">
              <ellipse
                cx="110" cy="140" rx="100" ry="130"
                fill="none" strokeWidth="3"
                stroke={faceDetected ? '#10b981' : 'rgba(255,255,255,0.35)'}
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

        {/* Floating Presence Action Button (Bottom-Center) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[300px] px-6">
          <Button
            onClick={handleCapture}
            disabled={!faceDetected || isCapturing}
            className={`w-full text-white font-semibold transition-all duration-300 h-14 rounded-full text-sm touch-manipulation shadow-2xl border ${
              faceDetected
                ? accentColor === 'indigo'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 border-indigo-400/20 shadow-indigo-500/30'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 border-emerald-400/20 shadow-emerald-500/30'
                : 'bg-black/60 text-white/40 border-white/10 cursor-not-allowed'
            }`}
          >
            {isCapturing ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Memverifikasi...</>
            ) : (
              <><Camera className="w-5 h-5 mr-2" />{faceDetected ? 'Konfirmasi Presensi' : 'Tatap Kamera'}</>
            )}
          </Button>
        </div>

        {/* Loading Screen Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <p className="text-white/60 text-xs font-semibold tracking-wider">
              {!libraryReady
                ? 'MEMUAT SISTEM DETEKSI...'
                : !modelsLoaded
                  ? 'MENYIAPKAN AI...'
                  : 'MEMULAI KAMERA...'}
            </p>
          </div>
        )}

      </div>
    </>
  );
}
