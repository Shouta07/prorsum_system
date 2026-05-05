import Link from "next/link";
import { ScanLine } from "lucide-react";
import { CheckinButtons } from "./checkin-buttons";

export default function CheckinPage() {
  return (
    <main className="flex flex-col gap-6 px-5 py-6">
      <header>
        <h1 className="text-xl font-bold text-zinc-900">今日の記録</h1>
        <p className="mt-1 text-sm text-zinc-500">タップで XP がもらえるよ</p>
      </header>
      <CheckinButtons />
      <Link
        href="/checkin/qr"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
      >
        <ScanLine size={16} />
        ジムの QR で記録する
      </Link>
    </main>
  );
}
