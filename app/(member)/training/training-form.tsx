"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { logTraining } from "./actions";
import { cn } from "@/lib/utils";
import {
  PARTS,
  EQUIPMENT_LABEL,
  searchExercises,
  type PartId,
  type Exercise,
} from "@/lib/exercises";

const DURATIONS = [15, 30, 45, 60, 90, 120] as const;

type DraftSet = {
  id: string;
  exercise_name: string;
  weight_kg: number | null;
  reps: number | null;
  sets: number;
};

export function TrainingForm({
  onBehalfOf,
  onSuccess,
}: {
  onBehalfOf?: { user_id: string; display_name: string };
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [parts, setParts] = useState<PartId[]>([]);
  const [duration, setDuration] = useState(60);
  const [memo, setMemo] = useState("");
  const [drafts, setDrafts] = useState<DraftSet[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  function togglePart(id: PartId) {
    setParts((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function addExercise(ex: Exercise) {
    setDrafts((d) => [
      ...d,
      {
        id: `${ex.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        exercise_name: ex.name,
        weight_kg: ex.is_cardio ? null : 20,
        reps: ex.is_cardio ? 20 : 10,
        sets: ex.is_cardio ? 1 : 3,
      },
    ]);
    setPickerOpen(false);
  }

  function updateDraft(id: string, patch: Partial<DraftSet>) {
    setDrafts((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function removeDraft(id: string) {
    setDrafts((d) => d.filter((x) => x.id !== id));
  }

  const totalVolume = drafts.reduce(
    (s, d) => s + (d.weight_kg ?? 0) * (d.reps ?? 0) * (d.sets ?? 1),
    0,
  );

  function onSubmit() {
    if (parts.length === 0 && drafts.length === 0) {
      toast.error("部位か種目を1つ以上選んでください");
      return;
    }

    const labels = PARTS.filter((p) => parts.includes(p.id)).map((p) => p.label).join("、");
    const content =
      labels && memo.trim()
        ? `${labels}（${memo.trim()}）`
        : labels
          ? labels
          : memo.trim() || "トレーニング";

    startTransition(async () => {
      const result = await logTraining({
        content,
        duration_min: duration,
        memberId: onBehalfOf?.user_id,
        exercises: drafts.map(({ id: _id, ...d }) => d),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        onBehalfOf
          ? `${onBehalfOf.display_name} さんのトレを記録しました`
          : "トレーニングを記録しました（+2 XP）",
      );
      setParts([]);
      setDrafts([]);
      setMemo("");
      setDuration(60);
      router.refresh();
      onSuccess?.();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>鍛えた部位（複数OK）</Label>
        <div className="flex flex-wrap gap-2">
          {PARTS.map((p) => {
            const active = parts.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePart(p.id)}
                className={cn(
                  "h-9 rounded-full px-4 text-sm font-medium ring-1 transition",
                  active
                    ? "bg-emerald-600 text-white ring-emerald-600"
                    : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>種目（重さ × 回数 × セット）</Label>
          {drafts.length > 0 && (
            <p className="text-xs font-bold text-emerald-600">
              合計 {totalVolume.toLocaleString()} kg
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {drafts.map((d) => (
            <DraftCard key={d.id} draft={d} onChange={updateDraft} onRemove={removeDraft} />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex h-11 items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-zinc-300 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          <Plus size={16} />
          種目を追加
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <Label>所要時間</Label>
        <div className="grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={cn(
                "h-10 rounded-md text-sm font-medium ring-1 transition",
                duration === d
                  ? "bg-zinc-900 text-white ring-zinc-900"
                  : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50",
              )}
            >
              {d} 分
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="memo">
          メモ <span className="text-xs font-normal text-zinc-400">（任意）</span>
        </Label>
        <input
          id="memo"
          type="text"
          maxLength={200}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="例: フォーム意識した、調子良かった"
          className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1"
        />
      </div>

      <Button type="button" onClick={onSubmit} size="lg" disabled={isPending}>
        {isPending ? "記録中…" : "記録する"}
      </Button>

      {pickerOpen && (
        <ExercisePicker
          activeParts={parts}
          onPick={addExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function DraftCard({
  draft,
  onChange,
  onRemove,
}: {
  draft: DraftSet;
  onChange: (id: string, patch: Partial<DraftSet>) => void;
  onRemove: (id: string) => void;
}) {
  const volume = (draft.weight_kg ?? 0) * (draft.reps ?? 0) * (draft.sets ?? 1);
  return (
    <div className="rounded-lg bg-zinc-50 p-3 ring-1 ring-zinc-100">
      <div className="flex items-start justify-between pb-2">
        <p className="text-sm font-medium text-zinc-900">{draft.exercise_name}</p>
        <button
          type="button"
          onClick={() => onRemove(draft.id)}
          aria-label="削除"
          className="text-zinc-400 hover:text-zinc-700"
        >
          <X size={16} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumericField
          label="重さ(kg)"
          value={draft.weight_kg}
          step={0.5}
          min={0}
          max={500}
          onChange={(v) => onChange(draft.id, { weight_kg: v })}
        />
        <NumericField
          label="回数"
          value={draft.reps}
          step={1}
          min={0}
          max={500}
          onChange={(v) => onChange(draft.id, { reps: v })}
        />
        <NumericField
          label="セット"
          value={draft.sets}
          step={1}
          min={1}
          max={20}
          onChange={(v) => onChange(draft.id, { sets: v ?? 1 })}
        />
      </div>
      {volume > 0 && (
        <p className="pt-2 text-right text-xs text-zinc-500">
          ボリューム {volume.toLocaleString()} kg
        </p>
      )}
    </div>
  );
}

function NumericField({
  label,
  value,
  step,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number | null;
  step: number;
  min: number;
  max: number;
  onChange: (v: number | null) => void;
}) {
  function adjust(delta: number) {
    const next = (value ?? 0) + delta;
    onChange(Math.max(min, Math.min(max, +next.toFixed(1))));
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => adjust(-step)}
          className="size-7 rounded bg-white text-sm text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value ?? ""}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(Number.isFinite(v) ? v : null);
          }}
          className="w-full bg-transparent text-center text-sm font-bold tabular-nums text-zinc-900 outline-none"
        />
        <button
          type="button"
          onClick={() => adjust(step)}
          className="size-7 rounded bg-white text-sm text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
        >
          ＋
        </button>
      </div>
    </div>
  );
}

function ExercisePicker({
  activeParts,
  onPick,
  onClose,
}: {
  activeParts: PartId[];
  onPick: (ex: Exercise) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filterParts, setFilterParts] = useState<PartId[]>(activeParts);

  const results = useMemo(
    () => searchExercises(query, filterParts),
    [query, filterParts],
  );

  function togglePart(id: PartId) {
    setFilterParts((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 pb-2">
          <h3 className="text-base font-bold text-zinc-900">種目を選ぶ</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="text-zinc-500"
          >
            <X size={20} />
          </button>
        </header>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="種目名で検索（例: ベンチ）"
              className="h-10 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {PARTS.map((p) => {
            const active = filterParts.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePart(p.id)}
                className={cn(
                  "h-7 rounded-full px-3 text-xs font-medium ring-1 transition",
                  active
                    ? "bg-emerald-600 text-white ring-emerald-600"
                    : "bg-white text-zinc-700 ring-zinc-200",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto">
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">該当する種目がありません</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {results.map((ex) => (
                <li key={ex.name}>
                  <button
                    type="button"
                    onClick={() => onPick(ex)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900">{ex.name}</span>
                      <span className="text-xs text-zinc-500">
                        {EQUIPMENT_LABEL[ex.equipment]}
                      </span>
                    </div>
                    <Plus size={18} className="text-emerald-600" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
