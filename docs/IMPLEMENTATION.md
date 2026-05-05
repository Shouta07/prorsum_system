# GymQuest 実装プロンプト集

各フェーズを上から順に Claude Code に貼り付けて使う。1フェーズが完了するまで次に進まない。

---

## Phase 0 — Setup

```
あなたは GymQuest の実装を担当する。CLAUDE.md を読んでから着手してくれ。

このフェーズのゴール:
- Next.js 15 プロジェクトの初期化
- Supabase ローカル環境のセットアップ
- 初期スキーマの適用
- 認証ページの最小実装（メール+パスワード）

手順:
1. `npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"` で初期化
2. shadcn 初期化: `npx shadcn@latest init`
3. パッケージ: `npm i @supabase/supabase-js @supabase/ssr react-hook-form zod @hookform/resolvers date-fns recharts lucide-react sonner`
4. Supabase 用ファイルを作成: `lib/supabase/client.ts`, `server.ts`, `middleware.ts`
5. `supabase/migrations/20260505_initial.sql` をローカル Supabase に適用
6. `lib/types/database.ts` を `supabase gen types` で生成
7. `/login` ページ（メール+パスワード、shadcn の Form）
8. `/(member)/layout.tsx` と最小の `/(member)/page.tsx`

完了基準:
- `npm run dev` で起動し、未ログイン時は `/login` にリダイレクト
- ログインすると `display_name` が表示される
- `npm run build` がエラーなく通る

完了したらコミットして報告してくれ。
```

---

## Phase 1 — Core Loop（出席→XP→アバター）

```
Phase 0 完了確認済み。Phase 1 に進む。CLAUDE.md を再確認してから着手。

ゴール: 会員アプリの「行動して育つ」コアループを動作させる。

実装範囲:

1. 初回ログイン時のアバター孵化フロー
   - `profile.role` が 'member' で `avatars` レコードがない場合
   - `/onboarding` に飛ばし、アバター名を入力させて作成 → `/(member)` に戻る

2. 会員ダッシュボード `/(member)/page.tsx`
   - 上部: アバター画像（`current_skin` に応じて `public/avatars/level-N.png` を出し分け）
   - 中段: 「Lv.3 / あと 45 XP で Lv.4」のゲージ
   - 下段: 今月のカレンダー（出席日に色付け、パーソナル/自主で色違い）
   - フッタ: ボトムナビ

3. チェックイン `/(member)/checkin/page.tsx`
   - 大きなボタン2つ:「パーソナルジムに行った（+10 XP）」「自主トレした（+3 XP）」
   - タップで Server Action → `check_ins` に insert
   - Postgres trigger が `members` の `current_xp` と `current_level` を自動更新する前提
   - 完了したら toast「+10 XP！」
   - レベルアップ時は専用モーダル + 簡単なアニメーション

4. カレンダーコンポーネント
   - 純 React + Tailwind で実装。外部ライブラリ不可
   - 月切り替え可能

明確な制約:
- XP 計算をクライアント側で行わない
- チェックインボタンはタップ → 即 insert → 即 toast。確認ダイアログ不可
- レベルアップ判定は insert 前後の `current_level` を比較

完了基準:
- 初回ログインで孵化フローが走る
- パーソナルボタンで XP +10、ゲージ伸びる
- 累積30 XP超えでレベル2、専用モーダル
- カレンダーに色が付く
- モバイル幅375pxで破綻しない

完了したらコミットして報告。
```

---

## Phase 2 — Records（体重・トレ内容）

```
Phase 1 完了確認済み。Phase 2 に進む。

ゴール: 体重記録とトレーニング記録の実装。両方とも XP 加算対象。

実装範囲:

1. 体重記録 `/(member)/weight/page.tsx`
   - 上部: 直近30日の推移グラフ（Recharts LineChart）
   - 中段: 今日の入力フォーム
   - 下段: 過去30件の履歴
   - 1日1記録（同日は upsert）

2. トレ記録 `/(member)/training/page.tsx`
   - 上部: 今日の入力フォーム（textarea + 所要時間 select 15/30/45/60/90/120）
   - 下段: 過去履歴（日付降順、トレーナーFBがあれば吹き出し表示）

3. FB 表示コンポーネント `components/feedback/FeedbackBubble.tsx`
   - 吹き出しUI、アバター画像 + メッセージ + 投稿日時
   - 未読マーク対応（`feedbacks` に `read_at` カラム追加）

4. ダッシュボード組み込み
   - 最下部に「未読のメッセージ」セクション（最新3件）

制約:
- 体重もトレ記録も Server Action で保存
- 保存成功時は `revalidatePath`
- グラフは Client Component

完了基準:
- 体重入力 → 履歴とグラフに即反映、XP +1
- トレ記録入力 → 履歴に即反映、XP +2
- 同日に複数のトレ記録可、体重は1日1件のみ
- ダッシュボードで未読FBが見える

完了したらコミットして報告。
```

---

## Phase 3 — Trainer Side

```
Phase 2 完了確認済み。Phase 3 に進む。

ゴール: トレーナー/管理者が会員管理と FB 投稿を行えるようにする。

実装範囲:

1. トレーナー会員一覧 `/(trainer)/trainer/page.tsx`
   - `profile.role` が 'trainer' または 'admin' のみアクセス可
   - 全会員の表（display_name / current_level / 最終来訪日 / 直近体重 / 未返信のトレ記録数）
   - 行クリックで詳細

2. 会員詳細 `/(trainer)/trainer/[memberId]/page.tsx`
   - 上部: 基本情報 + 現在レベル + ストリーク
   - 中段: 体重推移グラフ
   - 下段: トレ記録のタイムライン（「FBを返す」ボタン）

3. FB 投稿 `/(trainer)/trainer/[memberId]/feedback/page.tsx?trainingId=xxx`
   - 対象トレ記録をカード表示
   - コメント入力 + 投稿
   - 投稿で `feedbacks` に insert + 未読マーク

4. いいねボタン
   - トレ記録カードに heart アイコン
   - `feedbacks` に `type='like'` で insert
   - 会員に +5 XP（trigger で処理）

ロール制御:
- `middleware.ts` で `/(trainer)` 以下は role チェック
- RLS でも追加チェック
- `profile.role` の更新は admin のみ

完了基準:
- トレーナーアカウントで会員一覧が見える
- 会員詳細で体重推移とトレ記録
- FB 投稿 → 会員側に未読として表示
- いいね → 該当会員の XP +5
- 会員アカウントは `/(trainer)` にアクセスできない

完了したらコミットして報告。
```

---

## Phase 4 — Polish

```
Phase 3 完了確認済み。最終フェーズ。

ゴール: 本番投入できる完成度に仕上げる。

実装範囲:

1. ストリーク
   - `streaks` テーブルを利用
   - `check_ins` insert の trigger で更新
   - ダッシュボードに「🔥 5日連続」表示

2. 寂しいアバター
   - 7日連続で `check_ins` がないと `avatars.state` を 'lonely' に
   - lonely 時は grayscale + 「久しぶり…」セリフ
   - 復帰チェックインで 'celebrating' を経て 'normal' に

3. レベルアップ演出
   - 自前 SVG パーティクルで confetti
   - 効果音は今回入れない

4. オンボーディング改善
   - 卵が割れる演出（CSS animation）
   - 命名 → 短いチュートリアル3画面 → ダッシュボード

5. PWA 化
   - `manifest.json`
   - service worker（next-pwa）
   - ホーム画面追加可能に

6. エラー境界とローディング
   - 各 route group に `loading.tsx` と `error.tsx`
   - 空状態の専用 UI

7. 管理者設定 `/(admin)/admin/settings/page.tsx`
   - `point_settings` 編集 UI
   - 各会員レベル分布の表示

完了基準:
- Lighthouse モバイル PWA スコア 80以上
- ホーム画面追加可能
- すべての主要画面でローディング・エラー・空状態UI完備
- 管理者設定からポイントレート変更が次回チェックインから反映

完了したらコミットして、本番デプロイ準備手順を教えてくれ。
```
