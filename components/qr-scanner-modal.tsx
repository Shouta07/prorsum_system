"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export function QrScannerModal({
  open,
  onClose,
  onDecode,
}: {
  open: boolean;
  onClose: () => void;
  onDecode: (text: string) => void;
}) {
  const containerId = "qr-scanner-region";
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    (async () => {
      setError(null);
      setStarting(true);
      try {
        const mod = await import("html5-qrcode");
        const Html5Qrcode = mod.Html5Qrcode;
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = {
          stop: () => scanner.stop(),
          clear: () => scanner.clear(),
        };
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (cancelled) return;
            cancelled = true;
            scanner
              .stop()
              .catch(() => {})
              .finally(() => {
                onDecode(decoded);
              });
          },
          () => {
            // not found in frame; ignore
          },
        );
        if (cancelled) {
          await scanner.stop().catch(() => {});
        }
        setStarting(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "カメラを起動できませんでした";
        setError(msg);
        setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop()
          .catch(() => {})
          .finally(() => {
            try {
              s.clear();
            } catch {
              // ignore
            }
          });
        scannerRef.current = null;
      }
    };
  }, [open, onDecode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <header className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] py-3 text-white">
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="inline-flex size-9 items-center justify-center rounded-full bg-white/10"
        >
          <X size={20} />
        </button>
        <h2 className="text-sm font-bold">ジムの QR をスキャン</h2>
        <div className="size-9" />
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div id={containerId} className="absolute inset-0 [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover" />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="size-64 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
        </div>

        {(starting || error) && (
          <div className="absolute inset-x-0 bottom-10 mx-auto flex max-w-xs flex-col items-center gap-2 px-6 text-center text-white">
            {error ? (
              <>
                <p className="text-sm font-bold">カメラを起動できませんでした</p>
                <p className="text-xs text-white/70">{error}</p>
                <p className="text-xs text-white/60">
                  ブラウザ設定でカメラ許可を確認してください。
                </p>
              </>
            ) : (
              <p className="text-xs text-white/70">カメラを起動中…</p>
            )}
          </div>
        )}
      </div>

      <footer className="px-4 pb-[env(safe-area-inset-bottom,16px)] pt-3 text-center text-xs text-white/60">
        QR をフレーム内に合わせると自動で読み取ります
      </footer>
    </div>
  );
}
