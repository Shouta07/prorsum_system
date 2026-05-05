import Link from "next/link";

export function DemoBanner({
  switchHref = "/trainer",
  switchLabel = "トレーナー画面へ",
}: {
  switchHref?: string;
  switchLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-amber-100 px-4 py-2 text-xs text-amber-900">
      <span>デモモード（操作は保存されません）</span>
      <Link href={switchHref} className="font-bold underline">
        {switchLabel}
      </Link>
    </div>
  );
}
