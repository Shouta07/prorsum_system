export const PARTS = [
  { id: "chest", label: "胸" },
  { id: "back", label: "背中" },
  { id: "legs", label: "脚" },
  { id: "shoulders", label: "肩" },
  { id: "arms", label: "腕" },
  { id: "abs", label: "腹筋" },
  { id: "cardio", label: "有酸素" },
  { id: "fullbody", label: "全身" },
  { id: "recovery", label: "リカバリー" },
] as const;

export type PartId = (typeof PARTS)[number]["id"];

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "kettlebell"
  | "other";

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: "バーベル",
  dumbbell: "ダンベル",
  machine: "マシン",
  cable: "ケーブル",
  bodyweight: "自重",
  kettlebell: "ケトルベル",
  other: "その他",
};

export type Exercise = {
  name: string;
  parts: PartId[];
  equipment: Equipment;
  is_cardio?: boolean;
};

export const EXERCISES: Exercise[] = [
  // 胸
  { name: "ベンチプレス", parts: ["chest"], equipment: "barbell" },
  { name: "ダンベルプレス", parts: ["chest"], equipment: "dumbbell" },
  { name: "インクラインベンチプレス", parts: ["chest"], equipment: "barbell" },
  { name: "インクラインダンベルプレス", parts: ["chest"], equipment: "dumbbell" },
  { name: "ダンベルフライ", parts: ["chest"], equipment: "dumbbell" },
  { name: "ケーブルクロスオーバー", parts: ["chest"], equipment: "cable" },
  { name: "ペックフライ", parts: ["chest"], equipment: "machine" },
  { name: "プッシュアップ", parts: ["chest"], equipment: "bodyweight" },
  { name: "ディップス", parts: ["chest", "arms"], equipment: "bodyweight" },

  // 背中
  { name: "懸垂", parts: ["back"], equipment: "bodyweight" },
  { name: "ラットプルダウン", parts: ["back"], equipment: "machine" },
  { name: "ベントオーバーロウ", parts: ["back"], equipment: "barbell" },
  { name: "ダンベルロウ", parts: ["back"], equipment: "dumbbell" },
  { name: "シーテッドロウ", parts: ["back"], equipment: "machine" },
  { name: "デッドリフト", parts: ["back", "legs"], equipment: "barbell" },
  { name: "ルーマニアンデッドリフト", parts: ["back", "legs"], equipment: "barbell" },
  { name: "Tバーロウ", parts: ["back"], equipment: "barbell" },
  { name: "ハイパーエクステンション", parts: ["back"], equipment: "bodyweight" },

  // 脚
  { name: "スクワット", parts: ["legs"], equipment: "barbell" },
  { name: "フロントスクワット", parts: ["legs"], equipment: "barbell" },
  { name: "ハックスクワット", parts: ["legs"], equipment: "machine" },
  { name: "レッグプレス", parts: ["legs"], equipment: "machine" },
  { name: "ランジ", parts: ["legs"], equipment: "dumbbell" },
  { name: "ブルガリアンスクワット", parts: ["legs"], equipment: "dumbbell" },
  { name: "レッグエクステンション", parts: ["legs"], equipment: "machine" },
  { name: "レッグカール", parts: ["legs"], equipment: "machine" },
  { name: "カーフレイズ", parts: ["legs"], equipment: "machine" },
  { name: "ヒップスラスト", parts: ["legs"], equipment: "barbell" },

  // 肩
  { name: "ショルダープレス", parts: ["shoulders"], equipment: "dumbbell" },
  { name: "オーバーヘッドプレス", parts: ["shoulders"], equipment: "barbell" },
  { name: "サイドレイズ", parts: ["shoulders"], equipment: "dumbbell" },
  { name: "フロントレイズ", parts: ["shoulders"], equipment: "dumbbell" },
  { name: "リアレイズ", parts: ["shoulders"], equipment: "dumbbell" },
  { name: "アップライトロウ", parts: ["shoulders"], equipment: "barbell" },
  { name: "シュラッグ", parts: ["shoulders", "back"], equipment: "dumbbell" },

  // 腕
  { name: "バーベルカール", parts: ["arms"], equipment: "barbell" },
  { name: "ダンベルカール", parts: ["arms"], equipment: "dumbbell" },
  { name: "ハンマーカール", parts: ["arms"], equipment: "dumbbell" },
  { name: "プリーチャーカール", parts: ["arms"], equipment: "machine" },
  { name: "トライセプスエクステンション", parts: ["arms"], equipment: "dumbbell" },
  { name: "プッシュダウン", parts: ["arms"], equipment: "cable" },
  { name: "リストカール", parts: ["arms"], equipment: "dumbbell" },

  // 腹筋
  { name: "クランチ", parts: ["abs"], equipment: "bodyweight" },
  { name: "プランク", parts: ["abs"], equipment: "bodyweight" },
  { name: "レッグレイズ", parts: ["abs"], equipment: "bodyweight" },
  { name: "ロシアンツイスト", parts: ["abs"], equipment: "dumbbell" },
  { name: "アブローラー", parts: ["abs"], equipment: "other" },
  { name: "ハンギングレッグレイズ", parts: ["abs"], equipment: "bodyweight" },

  // 有酸素
  { name: "ランニング", parts: ["cardio"], equipment: "other", is_cardio: true },
  { name: "バイク", parts: ["cardio"], equipment: "machine", is_cardio: true },
  { name: "エリプティカル", parts: ["cardio"], equipment: "machine", is_cardio: true },
  { name: "ローイング", parts: ["cardio"], equipment: "machine", is_cardio: true },
  { name: "縄跳び", parts: ["cardio"], equipment: "other", is_cardio: true },
  { name: "ステアクライマー", parts: ["cardio"], equipment: "machine", is_cardio: true },

  // 全身
  { name: "バーピー", parts: ["fullbody"], equipment: "bodyweight" },
  { name: "クリーン", parts: ["fullbody"], equipment: "barbell" },
  { name: "スナッチ", parts: ["fullbody"], equipment: "barbell" },
  { name: "ケトルベルスイング", parts: ["fullbody"], equipment: "kettlebell" },
  { name: "ターキッシュゲットアップ", parts: ["fullbody"], equipment: "kettlebell" },

  // リカバリー
  { name: "ストレッチ", parts: ["recovery"], equipment: "bodyweight" },
  { name: "フォームローラー", parts: ["recovery"], equipment: "other" },
  { name: "ヨガ", parts: ["recovery"], equipment: "bodyweight" },
];

export function exercisesForParts(partIds: PartId[]): Exercise[] {
  if (partIds.length === 0) return EXERCISES;
  const set = new Set(partIds);
  return EXERCISES.filter((e) => e.parts.some((p) => set.has(p)));
}

export function searchExercises(query: string, partIds: PartId[]): Exercise[] {
  const base = exercisesForParts(partIds);
  const q = query.trim();
  if (!q) return base;
  return base.filter((e) => e.name.includes(q));
}

export function isExerciseCardio(exerciseName: string): boolean {
  return EXERCISES.find((e) => e.name === exerciseName)?.is_cardio ?? false;
}

export function totalVolume(
  sets: { weight_kg: number | null; reps: number | null; sets: number | null }[],
): number {
  return sets.reduce((sum, s) => {
    const w = s.weight_kg ?? 0;
    const r = s.reps ?? 0;
    const c = s.sets ?? 1;
    return sum + w * r * c;
  }, 0);
}
