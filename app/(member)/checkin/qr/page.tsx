import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";

export const dynamic = "force-dynamic";

const VALID_VENUE_TOKENS = (process.env.GYM_VENUE_TOKENS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export default async function QrCheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  const { venue } = await searchParams;
  const demo = isDemoMode();

  if (!venue) {
    return (
      <main className="flex flex-col gap-4 px-5 py-6">
        <header>
          <h1 className="text-xl font-bold text-zinc-900">QR チェックイン</h1>
          <p className="mt-1 text-sm text-zinc-500">
            ジム入口の QR コードを読み取ると、自動でパーソナル来店が記録されます。
          </p>
        </header>
        <section className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center ring-1 ring-zinc-100">
          <div className="flex size-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <ScanLine size={40} />
          </div>
          <p className="text-sm text-zinc-700">
            QR コード読取を起動するには、お使いのスマホのカメラアプリで
            ジムの QR を読み取ってください。
          </p>
          <p className="text-xs text-zinc-400">
            （デモではこの画面の上の「パーソナル」ボタンと同等の動作になります）
          </p>
          <Link
            href="/checkin"
            className="text-xs text-emerald-600 underline"
          >
            通常のチェックイン画面に戻る
          </Link>
        </section>
      </main>
    );
  }

  // Validate venue token (strict in production)
  if (!demo && VALID_VENUE_TOKENS.length > 0 && !VALID_VENUE_TOKENS.includes(venue)) {
    return (
      <main className="flex flex-col items-center gap-4 px-5 py-12 text-center">
        <h1 className="text-lg font-bold text-zinc-900">QR が無効です</h1>
        <p className="text-sm text-zinc-500">
          ジム側にお問い合わせください。
        </p>
        <Link href="/" className="text-xs text-emerald-600 underline">
          ホームに戻る
        </Link>
      </main>
    );
  }

  if (demo) {
    return (
      <SuccessView points={10} />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: inserted, error } = await supabase
    .from("check_ins")
    .insert({ member_id: user.id, type: "personal" })
    .select("points_awarded")
    .single();

  if (error) {
    if (error.code === "23505") {
      return (
        <main className="flex flex-col items-center gap-4 px-5 py-12 text-center">
          <h1 className="text-lg font-bold text-zinc-900">本日チェックイン済みです</h1>
          <Link href="/" className="text-xs text-emerald-600 underline">ホームに戻る</Link>
        </main>
      );
    }
    return (
      <main className="flex flex-col items-center gap-4 px-5 py-12 text-center">
        <h1 className="text-lg font-bold text-zinc-900">記録に失敗しました</h1>
        <p className="text-sm text-zinc-500">{error.message}</p>
        <Link href="/checkin" className="text-xs text-emerald-600 underline">
          手動でチェックインする
        </Link>
      </main>
    );
  }

  return <SuccessView points={inserted.points_awarded} />;
}

function SuccessView({ points }: { points: number }) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5 py-12 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 size={48} />
      </div>
      <div>
        <p className="text-xs font-medium tracking-wider text-emerald-600">CHECK-IN</p>
        <p className="mt-1 text-2xl font-bold text-zinc-900">来店を記録しました</p>
        <p className="mt-1 text-sm text-zinc-500">+{points} XP 獲得</p>
      </div>
      <Link
        href="/"
        className="mt-2 inline-flex h-10 items-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white"
      >
        ホームへ
      </Link>
    </main>
  );
}
