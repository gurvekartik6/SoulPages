import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCamera, FiX } from 'react-icons/fi';

const SUPPORTED = typeof window !== 'undefined' && 'BarcodeDetector' in window;

export function BarcodeScannerModal({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !SUPPORTED) return;

    let cancelled = false;
    let detector;
    let rafId;

    async function start() {
      try {
        detector = new window.BarcodeDetector({ formats: ['ean_13'] });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const scan = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            // Books use EAN-13 (Bookland EAN, prefix 978/979) which is the
            // ISBN-13 itself — the only barcode format actually printed on
            // books, and the only one our OpenLibrary lookup can use.
            const isbnLike = codes.find((c) => /^\d{13}$/.test(c.rawValue));
            if (isbnLike) {
              onDetected(isbnLike.rawValue);
              return;
            }
          } catch {
            // detection hiccup on a single frame — keep scanning
          }
          rafId = requestAnimationFrame(scan);
        };
        rafId = requestAnimationFrame(scan);
      } catch {
        setError('Could not access the camera. Check your browser permissions, or enter the ISBN manually.  In Progress');
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [open, onDetected]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/70"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-medium text-ink">
                <FiCamera className="h-4 w-4" /> Scan barcode
              </h3>
              <button onClick={onClose} className="rounded-full p-2 text-muted hover:bg-paper-dim" aria-label="Close">
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {!SUPPORTED ? (
              <p className="mt-4 text-sm text-muted">
                Your browser doesn't support camera barcode scanning yet (this works in current Chrome/Edge on
                Android and desktop). Enter the ISBN manually instead.
              </p>
            ) : error ? (
              <p className="mt-4 text-sm text-stamp-red">{error}</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-lg bg-ink">
                <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
              </div>
            )}
            <p className="mt-3 text-center text-xs text-muted">Point your camera at the book's barcode.</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
