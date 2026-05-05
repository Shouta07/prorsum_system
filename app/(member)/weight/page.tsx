import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, getDemoWeights } from "@/lib/demo";
import { WeightChart } from "./weight-chart";
import { WeightForm } from "./weight-form";

export const dynamic = "force-dynamic";

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function WeightPage() {
  const today = ymd(new Date());

  let weights: { date: string; weight_kg: number }[];

  if (isDemoMode()) {
    weights = getDemoWeights();
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data } = await supabase
      .from("weights")
      .select("date, weight_kg")
      .gte("date", ymd(since))
      .order("date", { ascending: true });
    weights = data ?? [];
  }

  const chartData = weights.slice(-30);
  const history = [...weights].reverse().slice(0, 30);
  const todayValue = weights.find((w) => w.date === today)?.weight_kg ?? null;
  const first = chartData[0]?.weight_kg;
  const last = chartData[chartData.length - 1]?.weight_kg;
  const delta = first != null && last != null ? +(last - first).toFixed(1) : null;

  return (
    <main className="flex flex-col gap-5 px-4 py-5">
      <header>
        <h1 className="text-xl font-bold text-zinc-900">体重</h1>
        <p className="mt-1 text-sm text-zinc-500">毎日の記録で +1 XP</p>
      </header>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-100">
        <div className="flex items-end justify-between pb-2">
          <div>
            <p className="text-xs text-zinc-500">直近30日</p>
            <p className="text-2xl font-bold text-zinc-900">
              {last != null ? `${last} kg` : "—"}
            </p>
          </div>
          {delta != null && (
            <p
              className={`text-sm font-semibold ${delta < 0 ? "text-emerald-600" : delta > 0 ? "text-rose-500" : "text-zinc-500"}`}
            >
              {delta > 0 ? "+" : ""}
              {delta} kg
            </p>
          )}
        </div>
        <WeightChart data={chartData} />
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-100">
        <WeightForm todayValue={todayValue} />
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-100">
        <h2 className="pb-2 text-sm font-bold text-zinc-700">記録の履歴</h2>
        {history.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">まだ記録がありません</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {history.map((w) => (
              <li key={w.date} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-zinc-700">{w.date.slice(5).replace("-", "/")}</span>
                <span className="font-medium text-zinc-900">{w.weight_kg} kg</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
