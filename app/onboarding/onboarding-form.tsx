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

const schema = z.object({
  name: z.string().min(1, "名前を入力してください").max(20, "20文字以内で入力してください"),
});

type FormValues = z.infer<typeof schema>;

export function OnboardingForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "" } });

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
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-xs flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">アバターの名前</Label>
          <Input id="name" autoFocus {...register("name")} placeholder="例: ジムくん" />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "作成中…" : "この子と冒険を始める"}
        </Button>
      </form>
    </div>
  );
}
