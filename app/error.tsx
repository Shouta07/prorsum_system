"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  const isEnvMissing =
    error.message?.includes("NEXT_PUBLIC_SUPABASE_URL") ||
    error.name === "SupabaseEnvMissingError";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-xl font-bold text-zinc-900">
        {isEnvMissing ? "セットアップが未完了です" : "問題が発生しました"}
      </h1>
      {isEnvMissing ? (
        <div className="max-w-sm space-y-3 text-sm text-zinc-600">
          <p>
            Supabase の接続情報が設定されていません。Vercel の Project Settings → Environment
            Variables で以下を設定し、Redeploy してください。
          </p>
          <pre className="overflow-auto rounded bg-zinc-100 p-3 text-left text-xs">
{`NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY`}
          </pre>
        </div>
      ) : (
        <p className="max-w-sm text-sm text-zinc-600">
          時間をおいてもう一度お試しください。問題が続く場合は管理者までご連絡ください。
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex h-10 items-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white"
      >
        再試行
      </button>
    </main>
  );
}
