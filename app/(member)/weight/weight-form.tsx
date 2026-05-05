"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logWeight } from "./actions";

const schema = z.object({
  weight_kg: z
    .number({ message: "数値で入力してください" })
    .min(20, "20kg 以上で入力してください")
    .max(250, "250kg 以下で入力してください"),
});

type FormValues = z.infer<typeof schema>;

export function WeightForm({ todayValue }: { todayValue: number | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: todayValue != null ? { weight_kg: todayValue } : undefined,
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await logWeight(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("体重を記録しました");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
      <div className="flex-1 flex flex-col gap-1">
        <Label htmlFor="weight_kg">今日の体重</Label>
        <div className="flex items-center gap-2">
          <Input
            id="weight_kg"
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="例: 70.5"
            {...register("weight_kg", { valueAsNumber: true })}
          />
          <span className="text-sm text-zinc-500">kg</span>
        </div>
        {errors.weight_kg && (
          <p className="text-xs text-red-600">{errors.weight_kg.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending} className="h-10">
        {isPending ? "記録中…" : todayValue != null ? "更新" : "記録"}
      </Button>
    </form>
  );
}
