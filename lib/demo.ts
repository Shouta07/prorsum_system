import type { AvatarState, CheckinType } from "@/lib/types/database";
import type { PartId } from "@/lib/exercises";

export function isDemoMode() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export const DEMO_PROFILE = { display_name: "デモユーザー" };

export const DEMO_AVATAR: { name: string; current_skin: string; state: AvatarState } = {
  name: "ジムくん",
  current_skin: "level-3",
  state: "normal",
};

export const DEMO_MEMBER = { current_xp: 110, current_level: 3 };

export function getDemoCheckins(): { date: string; type: CheckinType }[] {
  const offsets: { offset: number; type: CheckinType }[] = [
    { offset: 1, type: "self" },
    { offset: 3, type: "personal" },
    { offset: 5, type: "self" },
    { offset: 7, type: "personal" },
    { offset: 10, type: "personal" },
    { offset: 12, type: "self" },
    { offset: 14, type: "personal" },
  ];
  return offsets
    .map(({ offset, type }) => {
      const d = daysAgo(offset);
      if (d.getMonth() !== new Date().getMonth()) return null;
      return { date: ymd(d), type };
    })
    .filter((x): x is { date: string; type: CheckinType } => x != null);
}

export function getDemoWeights(days = 365): { date: string; weight_kg: number }[] {
  const start = 75.5;
  const data: { date: string; weight_kg: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    // Long-term gentle decline + medium-term wave + short-term noise
    const trend = ((days - 1 - i) / (days - 1)) * -5.0;
    const wave = Math.sin(i / 14) * 0.6;
    const noise = Math.sin(i * 1.7) * 0.25;
    const w = +(start + trend + wave + noise).toFixed(1);
    data.push({ date: ymd(daysAgo(i)), weight_kg: w });
  }
  return data;
}

export type DemoExerciseSet = {
  id: string;
  exercise_name: string;
  weight_kg: number | null;
  reps: number | null;
  sets: number | null;
  position: number;
};

export type DemoTraining = {
  id: string;
  date: string;
  parts: PartId[];
  duration_min: number;
  memo: string | null;
  exercise_sets: DemoExerciseSet[];
  total_volume_kg: number;
  is_cardio: boolean;
  feedbacks: DemoFeedback[];
};

export type DemoFeedback = {
  id: string;
  type: "comment" | "like";
  content: string | null;
  trainer_name: string;
  read_at: string | null;
  created_at: string;
};

const TRAINING_LOG: {
  offset: number;
  parts: PartId[];
  duration_min: number;
  memo?: string;
  sets: { exercise_name: string; weight_kg: number | null; reps: number; sets: number }[];
}[] = [
  {
    offset: 1,
    parts: ["legs"],
    duration_min: 60,
    sets: [
      { exercise_name: "スクワット", weight_kg: 80, reps: 6, sets: 3 },
      { exercise_name: "ルーマニアンデッドリフト", weight_kg: 70, reps: 8, sets: 3 },
      { exercise_name: "レッグプレス", weight_kg: 100, reps: 10, sets: 3 },
    ],
  },
  {
    offset: 3,
    parts: ["chest", "arms"],
    duration_min: 45,
    sets: [
      { exercise_name: "ベンチプレス", weight_kg: 60, reps: 8, sets: 3 },
      { exercise_name: "ダンベルフライ", weight_kg: 12, reps: 10, sets: 3 },
      { exercise_name: "ダンベルカール", weight_kg: 14, reps: 10, sets: 3 },
    ],
  },
  {
    offset: 5,
    parts: ["cardio"],
    duration_min: 45,
    memo: "バイク 25分 + ローイング 15分",
    sets: [
      { exercise_name: "バイク", weight_kg: null, reps: 25, sets: 1 },
      { exercise_name: "ローイング", weight_kg: null, reps: 15, sets: 1 },
    ],
  },
  {
    offset: 7,
    parts: ["back"],
    duration_min: 45,
    sets: [
      { exercise_name: "懸垂", weight_kg: 0, reps: 8, sets: 3 },
      { exercise_name: "ラットプルダウン", weight_kg: 50, reps: 10, sets: 3 },
      { exercise_name: "ベントオーバーロウ", weight_kg: 50, reps: 8, sets: 3 },
    ],
  },
  {
    offset: 10,
    parts: ["fullbody"],
    duration_min: 75,
    memo: "ビッグ3デー",
    sets: [
      { exercise_name: "スクワット", weight_kg: 90, reps: 5, sets: 3 },
      { exercise_name: "ベンチプレス", weight_kg: 65, reps: 5, sets: 3 },
      { exercise_name: "デッドリフト", weight_kg: 100, reps: 5, sets: 3 },
    ],
  },
  {
    offset: 12,
    parts: ["shoulders", "arms"],
    duration_min: 45,
    sets: [
      { exercise_name: "ショルダープレス", weight_kg: 30, reps: 8, sets: 3 },
      { exercise_name: "サイドレイズ", weight_kg: 8, reps: 12, sets: 3 },
      { exercise_name: "ダンベルカール", weight_kg: 14, reps: 10, sets: 3 },
    ],
  },
  {
    offset: 14,
    parts: ["cardio", "abs"],
    duration_min: 30,
    sets: [
      { exercise_name: "ランニング", weight_kg: null, reps: 20, sets: 1 },
      { exercise_name: "プランク", weight_kg: 0, reps: 60, sets: 3 },
    ],
  },
  {
    offset: 18,
    parts: ["legs"],
    duration_min: 45,
    sets: [
      { exercise_name: "ブルガリアンスクワット", weight_kg: 16, reps: 10, sets: 3 },
      { exercise_name: "レッグカール", weight_kg: 35, reps: 12, sets: 3 },
    ],
  },
  {
    offset: 22,
    parts: ["chest"],
    duration_min: 45,
    sets: [
      { exercise_name: "インクラインベンチプレス", weight_kg: 50, reps: 8, sets: 3 },
      { exercise_name: "ディップス", weight_kg: 0, reps: 8, sets: 3 },
    ],
  },
  {
    offset: 26,
    parts: ["recovery"],
    duration_min: 30,
    memo: "ストレッチとフォームローラー多め",
    sets: [],
  },
];

const FEEDBACK_BY_OFFSET: Record<
  number,
  { type: "comment" | "like"; content: string | null; read: boolean }[]
> = {
  1: [
    {
      type: "comment",
      content: "スクワット 80kg のフォーム、深さが安定してきましたね。次回は 82.5kg いきましょう",
      read: false,
    },
  ],
  3: [{ type: "like", content: null, read: true }],
  7: [
    {
      type: "comment",
      content: "懸垂8回×3セットすごい。半年前は1回もできなかったの覚えてますか？",
      read: false,
    },
  ],
  10: [
    {
      type: "comment",
      content: "ビッグ3一気にやるスタミナがついてきた証拠です。良いペースです",
      read: true,
    },
    { type: "like", content: null, read: true },
  ],
  18: [{ type: "like", content: null, read: true }],
};

export function getDemoTrainings(): DemoTraining[] {
  return TRAINING_LOG.map((t, i) => {
    const exercise_sets: DemoExerciseSet[] = t.sets.map((s, j) => ({
      id: `demo-ex-${i}-${j}`,
      exercise_name: s.exercise_name,
      weight_kg: s.weight_kg,
      reps: s.reps,
      sets: s.sets,
      position: j,
    }));
    const total_volume_kg = exercise_sets.reduce((sum, s) => {
      const w = s.weight_kg ?? 0;
      const r = s.reps ?? 0;
      const c = s.sets ?? 1;
      return sum + w * r * c;
    }, 0);

    const fbs = FEEDBACK_BY_OFFSET[t.offset] ?? [];
    return {
      id: `demo-tr-${i}`,
      date: ymd(daysAgo(t.offset)),
      parts: t.parts,
      duration_min: t.duration_min,
      memo: t.memo ?? null,
      exercise_sets,
      total_volume_kg,
      is_cardio: t.parts.includes("cardio"),
      feedbacks: fbs.map((f, j) => ({
        id: `demo-fb-${i}-${j}`,
        type: f.type,
        content: f.content,
        trainer_name: "市川トレーナー",
        read_at: f.read ? ymd(daysAgo(t.offset - 1)) : null,
        created_at: ymd(daysAgo(t.offset - 1)),
      })),
    };
  });
}

export type DemoUnreadFeedback = {
  id: string;
  trainer_name: string;
  content: string;
  created_at: string;
  training_excerpt: string;
};

export function getDemoUnreadFeedbacks(): DemoUnreadFeedback[] {
  const trainings = getDemoTrainings();
  const out: DemoUnreadFeedback[] = [];
  for (const t of trainings) {
    for (const f of t.feedbacks) {
      if (f.type === "comment" && f.read_at == null && f.content) {
        out.push({
          id: f.id,
          trainer_name: f.trainer_name,
          content: f.content,
          created_at: f.created_at,
          training_excerpt: (t.exercise_sets[0]?.exercise_name ?? "トレーニング").slice(0, 24),
        });
      }
    }
  }
  return out.slice(0, 3);
}

export const DEMO_MEMBERS = [
  {
    user_id: "demo-member-1",
    display_name: "山田 健太",
    current_level: 3,
    current_xp: 110,
    last_visit: ymd(daysAgo(1)),
    last_weight: 70.2,
  },
  {
    user_id: "demo-member-2",
    display_name: "鈴木 あや",
    current_level: 5,
    current_xp: 320,
    last_visit: ymd(daysAgo(0)),
    last_weight: 54.5,
  },
  {
    user_id: "demo-member-3",
    display_name: "高橋 翔",
    current_level: 2,
    current_xp: 55,
    last_visit: ymd(daysAgo(8)),
    last_weight: 78.4,
  },
  {
    user_id: "demo-member-4",
    display_name: "渡辺 まり",
    current_level: 4,
    current_xp: 220,
    last_visit: ymd(daysAgo(2)),
    last_weight: 60.1,
  },
];
