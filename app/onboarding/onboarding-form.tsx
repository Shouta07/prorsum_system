"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarImage } from "@/components/avatar/AvatarImage";
import { createAvatar } from "./actions";

const PRESETS = ["ジムくん", "マッチョ", "もちぞう", "ふわぴ", "リオ", "ジョー"] as const;

const schema = z.object({
  name: z.string().min(1, "名前を入力してください").max(20, "20文字以内で入力してください"),
});

type FormValues = z.infer<typeof schema>;

export function OnboardingForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "" } });
  const nameValue = watch("name");

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await createAvatar(values);
      if (result && !result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <AvatarImage skin="level-1" className="w-40 h-40" />
      <div className="text-center">
        <h1 className="text-xl font-bold text-zinc-900">タマゴが孵ったよ</h1>
        <p className="mt-1 text-sm text-zinc-500">
          相棒に名前をつけよう。これからあなたと一緒に育っていきます。
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-xs flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>候補から選ぶ</Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const active = nameValue === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    setValue("name", p, { shouldValidate: true, shouldDirty: true })
                  }
                  className={`h-9 rounded-full px-4 text-sm font-medium ring-1 transition ${
                    active
                      ? "bg-emerald-600 text-white ring-emerald-600"
                      : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">
            または自分でつける
            <span className="ml-1 text-xs font-normal text-zinc-400">（20文字以内）</span>
          </Label>
          <Input id="name" {...register("name")} placeholder="例: ジムくん" />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "作成中…" : "この子と冒険を始める"}
        </Button>
      </form>
    </div>
  );
}
