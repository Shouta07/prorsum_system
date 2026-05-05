"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { logTraining } from "./actions";

const DURATIONS = [15, 30, 45, 60, 90, 120] as const;

const schema = z.object({
  content: z.string().min(1, "内容を入力してください").max(500),
  duration_min: z.number().int(),
});

type FormValues = z.infer<typeof schema>;

export function TrainingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { content: "", duration_min: 60 },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await logTraining(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("トレーニングを記録しました（+2 XP）");
      reset({ content: "", duration_min: 60 });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="content">今日のトレーニング</Label>
        <textarea
          id="content"
          rows={3}
          placeholder="例: ベンチプレス 60kg×8×3、スクワット 80kg×6×3"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1"
          {...register("content")}
        />
        {errors.content && <p className="text-xs text-red-600">{errors.content.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>所要時間</Label>
        <Controller
          control={control}
          name="duration_min"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => field.onChange(d)}
                  className={`h-10 rounded-md text-sm font-medium ring-1 transition ${
                    field.value === d
                      ? "bg-zinc-900 text-white ring-zinc-900"
                      : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {d} 分
                </button>
              ))}
            </div>
          )}
        />
      </div>
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "記録中…" : "記録する"}
      </Button>
    </form>
  );
}
