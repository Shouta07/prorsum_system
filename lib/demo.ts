import type { AvatarState, CheckinType } from "@/lib/types/database";

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
    { offset: -1, type: "self" },
    { offset: -3, type: "personal" },
    { offset: -5, type: "self" },
    { offset: -7, type: "personal" },
    { offset: -10, type: "personal" },
    { offset: -12, type: "self" },
    { offset: -14, type: "personal" },
  ];
  return offsets
    .map(({ offset, type }) => {
      const d = daysAgo(-offset);
      if (d.getMonth() !== new Date().getMonth()) return null;
      return { date: ymd(d), type };
    })
    .filter((x): x is { date: string; type: CheckinType } => x != null);
}

export function getDemoWeights(): { date: string; weight_kg: number }[] {
  const start = 72.6;
  const data: { date: string; weight_kg: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const trend = (29 - i) * -0.06;
    const wave = Math.sin(i / 2.3) * 0.35;
    const w = +(start + trend + wave).toFixed(1);
    data.push({ date: ymd(daysAgo(i)), weight_kg: w });
  }
  return data;
}

const TRAINING_LOG: { offset: number; content: string; duration_min: number }[] = [
  { offset: 1, content: "脚（スクワット 80kg×6×3）", duration_min: 60 },
  { offset: 3, content: "胸、腕", duration_min: 45 },
  { offset: 5, content: "有酸素", duration_min: 45 },
  { offset: 7, content: "背中（懸垂×8×3）", duration_min: 45 },
  { offset: 10, content: "全身（ビッグ3、各5×3）", duration_min: 75 },
  { offset: 12, content: "肩、腕", duration_min: 45 },
  { offset: 14, content: "有酸素、腹筋", duration_min: 30 },
  { offset: 18, content: "脚", duration_min: 45 },
  { offset: 22, content: "胸（インクラインベンチ、ディップス）", duration_min: 45 },
  { offset: 26, content: "リカバリー", duration_min: 30 },
];

type DemoTraining = {
  id: string;
  date: string;
  content: string;
  duration_min: number;
  feedbacks: DemoFeedback[];
};

type DemoFeedback = {
  id: string;
  type: "comment" | "like";
  content: string | null;
  trainer_name: string;
  read_at: string | null;
  created_at: string;
};

const FEEDBACK_BY_OFFSET: Record<
  number,
  { type: "comment" | "like"; content: string | null; read: boolean }[]
> = {
  1: [
    {
      type: "comment",
      content: "スクワットのフォーム、深さが安定してきましたね！次は重量上げてみましょう",
      read: false,
    },
  ],
  3: [{ type: "like", content: null, read: true }],
  7: [
    {
      type: "comment",
      content: "懸垂8回すごい。半年前は1回もできなかったの覚えてますか？",
      read: false,
    },
  ],
  10: [
    {
      type: "comment",
      content: "ビッグ3一気にやるのスタミナついてきた証拠です。良いペース",
      read: true,
    },
    { type: "like", content: null, read: true },
  ],
  18: [{ type: "like", content: null, read: true }],
};

export function getDemoTrainings(): DemoTraining[] {
  return TRAINING_LOG.map((t, i) => {
    const fbs = FEEDBACK_BY_OFFSET[t.offset] ?? [];
    return {
      id: `demo-tr-${i}`,
      date: ymd(daysAgo(t.offset)),
      content: t.content,
      duration_min: t.duration_min,
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
          training_excerpt: t.content.slice(0, 24),
        });
      }
    }
  }
  return out.slice(0, 3);
}
