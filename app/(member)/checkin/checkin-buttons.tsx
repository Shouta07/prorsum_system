"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dumbbell, Flame, ScanLine } from "lucide-react";
import { LevelUpModal } from "@/components/level-up-modal";
import { QrScannerModal } from "@/components/qr-scanner-modal";
import { checkIn } from "./actions";
import type { CheckinType } from "@/lib/types/database";

export function CheckinButtons() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingType, setPendingType] = useState<CheckinType | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number } | null>(null);
  const [scanOpen, setScanOpen] = useState(false);

  function handleClick(type: CheckinType) {
    setPendingType(type);
    startTransition(async () => {
      const result = await checkIn({ type });
      setPendingType(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`+${result.data.points} XP！`);
      if (result.data.leveledUp) {
        setLevelUp({ level: result.data.newLevel });
      }
      router.refresh();
    });
  }

  function handleDecode(text: string) {
    setScanOpen(false);
    let venue: string | null = null;
    try {
      // Try to parse as URL: https://app.example.com/checkin/qr?venue=token
      const u = new URL(text);
      venue = u.searchParams.get("venue");
      // Or path-encoded: /checkin/qr?venue=...
      if (!venue && u.pathname.startsWith("/checkin/qr")) {
        venue = u.searchParams.get("venue");
      }
    } catch {
      // Plain token text
      if (/^[A-Za-z0-9_-]{4,}$/.test(text.trim())) {
        venue = text.trim();
      }
    }

    if (!venue) {
      toast.error("対応していない QR コードです");
      return;
    }
    router.push(`/checkin/qr?venue=${encodeURIComponent(venue)}`);
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => handleClick("personal")}
          disabled={isPending}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
        >
          <Flame size={32} strokeWidth={2.5} />
          <span className="text-base font-bold">パーソナルジムに行った</span>
          <span className="text-xs opacity-90">
            {pendingType === "personal" && isPending ? "記録中…" : "+10 XP"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleClick("self")}
          disabled={isPending}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-sky-500 text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
        >
          <Dumbbell size={32} strokeWidth={2.5} />
          <span className="text-base font-bold">自主トレした</span>
          <span className="text-xs opacity-90">
            {pendingType === "self" && isPending ? "記録中…" : "+3 XP"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setScanOpen(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
        >
          <ScanLine size={16} />
          ジムの QR で記録する
        </button>
      </div>
      <LevelUpModal
        open={levelUp != null}
        level={levelUp?.level ?? 1}
        onClose={() => setLevelUp(null)}
      />
      <QrScannerModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onDecode={handleDecode}
      />
    </>
  );
}
