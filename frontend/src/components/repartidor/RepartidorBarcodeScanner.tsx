import { useLayoutEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { CameraOff, X } from 'lucide-react';

type Props = {
  onDecoded: (rawText: string) => void;
  onClose: () => void;
};

/** Solo montar cuando el usuario ha abierto el escáner. */
export function RepartidorBarcodeScanner({ onDecoded, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const decodedCbRef = useRef(onDecoded);
  decodedCbRef.current = onDecoded;

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    const reader = new BrowserMultiFormatReader(undefined, {
      delayBetweenScanAttempts: 120,
    });
    readerRef.current = reader;
    setStarting(true);
    setCameraError(null);

    reader
      .decodeFromVideoDevice(undefined, video, (result, err, controls) => {
        if (cancelled) return;
        if (result) {
          try {
            controls.stop();
          } catch {
            /* ignore */
          }
          decodedCbRef.current(result.getText());
          return;
        }
        if (err && (err as Error).name !== 'NotFoundException') {
          setCameraError((err as Error).message || 'No se pudo usar la cámara.');
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Permiso de cámara denegado o no disponible.';
        setCameraError(msg);
      })
      .finally(() => {
        if (!cancelled) setStarting(false);
      });

    return () => {
      cancelled = true;
      readerRef.current = null;
      try {
        reader.reset();
      } catch {
        /* ignore */
      }
      const stream = video.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Escáner de código"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <p className="text-sm font-semibold">Apunta al código de barras o QR</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 hover:bg-white/10 focus:ring-2 focus:ring-white/40 focus:outline-none"
          aria-label="Cerrar escáner"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-8">
        <video
          ref={videoRef}
          className="max-h-[70vh] w-full max-w-lg rounded-lg object-cover"
          muted
          playsInline
          autoPlay
        />

        {starting ? (
          <p className="absolute bottom-24 text-sm text-white/90">Iniciando cámara…</p>
        ) : null}

        {cameraError ? (
          <div className="absolute inset-x-4 bottom-24 flex flex-col items-center gap-3 rounded-xl bg-red-950/90 px-4 py-4 text-center text-sm text-red-50">
            <CameraOff className="h-10 w-10 shrink-0 opacity-90" aria-hidden />
            <p>{cameraError}</p>
            <button
              type="button"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-950"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        ) : null}

        <p className="mt-4 max-w-md text-center text-xs text-white/70">
          El código LINEAL lleva el número de seguimiento; el QR puede enlazar a la web — ambos son válidos.
        </p>
      </div>
    </div>
  );
}
