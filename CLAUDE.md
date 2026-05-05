# GymQuest — Personal Gym Member Engagement App

## What this is

パーソナルジム会員のリテンション向上を、出席記録 → ポイント → アバター育成のゲーミフィケーションで実現するモバイル Web アプリ。

- Client: パーソナルジム経営者（単一店舗）
- Owner of code: バイタリティデザイン合同会社
- Users: 会員（25-45歳）、トレーナー、管理者（兼経営者）
- Goal: 入会3ヶ月時点の継続率 50% → 70%

## Tech Stack (LOCKED — do not propose alternatives)

- Framework: Next.js 15 (App Router)
- Language: TypeScript (strict mode)
- UI: React 19 + Tailwind CSS + shadcn/ui
- Forms: react-hook-form + zod
- Backend: Supabase (Auth + Postgres + RLS + Storage)
- Client: @supabase/ssr + auto-generated types
- Charts: Recharts
- Date: date-fns（dayjs / moment は使用禁止）
- Icons: lucide-react
- Hosting: Vercel
- Notifications (P1): Web Push (PWA)

## Directory Structure

```
app/
  (auth)/login/page.tsx
  (member)/
    layout.tsx
    page.tsx
    checkin/page.tsx
    weight/page.tsx
    training/page.tsx
    avatar/page.tsx
  (trainer)/
    trainer/page.tsx
    trainer/[memberId]/page.tsx
    trainer/[memberId]/feedback/page.tsx
  (admin)/
    admin/settings/page.tsx
components/
  ui/
  avatar/AvatarCard.tsx
  calendar/MonthCalendar.tsx
  feedback/FeedbackBubble.tsx
lib/
  supabase/
    client.ts
    server.ts
    middleware.ts
  xp/rules.ts
  types/database.ts
public/avatars/level-1.png 〜 level-10.png
supabase/migrations/20260505_initial.sql
```

## Coding Conventions

**Server-first:**

- データ取得は Server Component で（`createServerClient` 経由）
- ミューテーションは Server Actions（`'use server'`）で。API ルートは原則作らない
- Client Component は `'use client'` を明示。インタラクション必要時のみ

**Type safety:**

- DB 型は `npx supabase gen types typescript --local > lib/types/database.ts` で生成
- 手書きの DB 型定義は禁止
- すべての Server Action 入力は zod スキーマで検証

**File naming:**

- Component: PascalCase
- それ以外: kebab-case
- Route group は `(member)` のように parens

**State:**

- サーバー状態 = Supabase + RSC再レンダリング
- フォーム状態 = react-hook-form
- グローバルストアは入れない

**Errors:**

- Server Action は `{ ok: true, data } | { ok: false, error }` を返す型を統一
- ユーザー通知は `sonner` の toast
- 想定外エラーは throw して `error.tsx` に任せる

## Critical Behavioral Rules

- アバターは退化させない。サボると「寂しい状態（lonely）」に変わるだけ
- 文言は「ジムに行く」ではなく「育てる」「記録する」のフレーミングで統一
- チェックインは1タップで完結。確認モーダルやフォームを挟まない
- XP 計算ロジックは Postgres trigger で行う。クライアント側で計算してから保存する設計は禁止
- RLS は全テーブルで有効化
- 会員側 UI はモバイル前提。`sm:` 未満で破綻していないかを必ず確認

## Out of Scope (Phase 1 で作らない)

LINE 連携 / 写真アップロード / 体脂肪率・筋肉量 / 目標体重 / 会員間ランキング / 予約機能 / 決済 / マルチテナント / ネイティブアプリ化

## XP Rules (constants)

```ts
// lib/xp/rules.ts
export const XP_RULES = {
  CHECK_IN_PERSONAL: 10,
  CHECK_IN_SELF: 3,
  WEIGHT_LOG: 1,
  TRAINING_LOG: 2,
  TRAINER_LIKE_BONUS: 5,
  DAILY_MAX: 16,
} as const;

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 30 },
  { level: 3, xp: 80 },
  { level: 4, xp: 160 },
  { level: 5, xp: 280 },
  { level: 6, xp: 450 },
  { level: 7, xp: 680 },
  { level: 8, xp: 980 },
  { level: 9, xp: 1360 },
  { level: 10, xp: 1830 },
] as const;
```

## Verify before committing

各タスク完了時:

- `npm run build` が通る
- `npm run lint` が通る
- 影響範囲のページを実機（モバイル幅）で動作確認
- RLS が効いているか別ユーザーで最低1回手動確認
