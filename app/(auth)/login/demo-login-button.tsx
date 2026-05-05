"use client";

import Link from "next/link";

export function DemoLoginButton() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-xs text-zinc-500">
        Supabase が未設定のため、デモデータでアプリを試せます。
      </p>
      <Link
        href="/"
        className="inline-flex h-12 items-center justify-center rounded-md bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"
      >
        デモを開始する
      </Link>
    </div>
  );
}
