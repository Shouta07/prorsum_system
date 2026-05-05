"use client";

export function LevelUpModal({
  open,
  level,
  onClose,
}: {
  open: boolean;
  level: number;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-xl animate-[pop_400ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <svg
          className="absolute -top-6 left-1/2 -translate-x-1/2 animate-[burst_700ms_ease-out]"
          width="120"
          height="80"
          viewBox="0 0 120 80"
          aria-hidden
        >
          {[
            ["#fbbf24", 20, 30],
            ["#34d399", 40, 10],
            ["#60a5fa", 60, 30],
            ["#a78bfa", 80, 10],
            ["#f472b6", 100, 30],
          ].map(([c, x, y]) => (
            <circle key={String(x)} cx={x as number} cy={y as number} r="5" fill={c as string} />
          ))}
        </svg>
        <p className="text-xs font-medium tracking-wider text-emerald-600">LEVEL UP!</p>
        <p className="mt-2 text-3xl font-extrabold text-zinc-900">Lv.{level}</p>
        <p className="mt-1 text-sm text-zinc-500">いっしょに大きくなったね！</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 text-sm font-medium text-white"
        >
          OK
        </button>
      </div>
      <style>{`
        @keyframes pop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes burst {
          0% { transform: translate(-50%, 30px) scale(0.5); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(-50%, -10px) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
