# GymQuest 開発設計書

最終更新: 2026-05

---

## 1. プロジェクト概要

| 項目 | 内容 |
|---|---|
| 名称 | GymQuest |
| 概要 | パーソナルジム会員のリテンション向上を目的とした、出席記録→ポイント→アバター育成のゲーミフィケーション型モバイル Web アプリ |
| クライアント | パーソナルジム経営者（単一店舗） |
| 開発主体 | バイタリティデザイン合同会社 |
| 主要 KPI | 入会3ヶ月時点の継続率 50% → 70% |
| 想定ユーザー数 | 会員 50〜200名、トレーナー 1〜5名、管理者 1名 |

### 1.1 解決する課題

- **離脱の早期検知ができない**: 来店頻度の低下が気づいた時には手遅れ
- **記録の負荷が高い**: 紙やアプリの記入が面倒で継続しない
- **トレーナーとの関係性が薄れる**: パーソナル以外の日に接点がない

### 1.2 提供価値

- **アバター育成で継続意欲を可視化**: 「サボると相棒が寂しがる」のフレーミング
- **1タップ記録**: 出席・体重・トレ内容すべて選択式中心で入力負担最小
- **トレーナーからのフィードバック**: 来店以外の日にも接点を作る

---

## 2. スコープ

### 2.1 含むもの（Phase 1〜4）

| カテゴリ | 内容 |
|---|---|
| 認証 | Email + パスワード（Supabase Auth） |
| 会員機能 | アバター孵化・チェックイン・XP/レベル・カレンダー・体重記録・トレ記録 |
| 種目管理 | 部位フィルタつき種目カタログ + 重量×回数×セット入力 |
| QR チェックイン | URL ベース + カメラスキャナ |
| トレーナー機能 | 会員一覧・会員詳細・代理記録・フィードバック投稿 |
| 通知 | Web Push（PWA） |
| 管理機能 | XP レート編集・会員レベル分布 |

### 2.2 含まないもの（Phase 5 以降または別契約）

- LINE 連携
- 写真・動画アップロード
- 体脂肪率・筋肉量・目標体重
- 会員間ランキング
- 予約機能・決済
- マルチテナント（複数店舗）
- ネイティブアプリ（iOS / Android）

---

## 3. 技術スタック

> このスタックは設計時に固定。代替案は提案しない。

| レイヤ | 採用技術 | 採用理由 |
|---|---|---|
| フレームワーク | Next.js 16 (App Router) | RSC で初回表示高速、Vercel と相性が良い |
| 言語 | TypeScript (strict) | 型安全、Supabase の型生成と相性が良い |
| UI ライブラリ | React 19 + Tailwind CSS v4 + shadcn/ui | モバイルファースト、デザイン一貫性 |
| フォーム | react-hook-form + zod | バリデーション統一、型推論 |
| バックエンド | Supabase | Auth / Postgres / RLS / Storage を1つで賄える |
| クライアント SDK | @supabase/ssr | App Router の RSC / Server Action と整合 |
| グラフ | Recharts | 軽量、Recharts の AreaChart で十分 |
| 日付 | date-fns | Tree-shaking 効くため。dayjs/moment は禁止 |
| アイコン | lucide-react | shadcn/ui のデフォルト |
| トースト | sonner | 軽量、shadcn/ui 準標準 |
| QR スキャン | html5-qrcode | iOS Safari / Android Chrome 両対応 |
| ホスティング | Vercel | Next.js 純正、エッジ配信、PR プレビュー |
| 通知 | Web Push（PWA） | ネイティブ不要、Phase 4 で導入 |

---

## 4. アーキテクチャ

### 4.1 全体構成図

```
   ┌──────────────┐       ┌──────────────┐
   │  Member (PWA)│       │ Trainer (PWA)│
   │  /(member)   │       │  /(trainer)  │
   └──────┬───────┘       └──────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │ HTTPS
              ┌──────▼──────┐
              │   Vercel    │
              │  Next.js 16 │
              │  App Router │
              └──────┬──────┘
                     │
            ┌────────▼────────┐
            │    Supabase     │
            │  ┌────────────┐ │
            │  │ Postgres   │ │  Triggers が XP 計算
            │  │  + RLS     │ │
            │  └────────────┘ │
            │  ┌────────────┐ │
            │  │  Auth      │ │
            │  └────────────┘ │
            │  ┌────────────┐ │
            │  │  Storage   │ │  アバター画像（任意）
            │  └────────────┘ │
            └─────────────────┘
```

### 4.2 設計原則

- **Server-first**: データ取得は Server Component、ミューテーションは Server Actions。原則 API ルートは作らない
- **型安全**: DB 型は `supabase gen types` で生成、手書き禁止
- **検証**: すべての Server Action 入力を zod で検証
- **XP は DB 側で計算**: クライアントで計算してから保存する設計は禁止（Postgres trigger で完結）
- **RLS 必須**: 全テーブルで Row Level Security を有効化、policy で会員/トレーナー/管理者の権限を分離
- **状態管理**: サーバー状態 = Supabase、フォーム状態 = react-hook-form、グローバルストアは入れない
- **エラー設計**: Server Action は `{ ok: true, data } | { ok: false, error }` 形式で統一
- **デモモード**: env 未設定時は自動でデモデータに切替（営業デモ用）

### 4.3 ディレクトリ構成

```
app/
  (auth)/login/         ログイン + デモエントリ
  (member)/             会員側
    layout.tsx          認証 + アバター存在チェック + 下部ナビ
    page.tsx            ダッシュボード
    checkin/            チェックイン (+QR)
    weight/             体重記録
    training/           トレ記録
  (trainer)/            トレーナー側
    layout.tsx          ロール認証
    trainer/            会員一覧 + 詳細 + 代理記録
  onboarding/           初回のアバター孵化
  error.tsx             共通エラー表示

components/
  ui/                   Button/Input/Label（shadcn 置き換え予定）
  avatar/               AvatarCard / AvatarImage
  calendar/             MonthCalendar
  feedback/             FeedbackBubble
  bottom-nav.tsx        モバイル下部ナビ
  level-up-modal.tsx    レベルアップ演出
  qr-scanner-modal.tsx  カメラ起動 QR スキャナ
  demo-banner.tsx       デモモード時の上部バナー

lib/
  supabase/             Browser/Server/Middleware クライアント
  types/database.ts     Supabase 自動生成型
  xp/rules.ts           XP 定数 + レベル換算
  exercises.ts          種目カタログ
  demo.ts               デモデータ生成
  utils.ts              cn ヘルパー

supabase/
  migrations/
    20260505_initial.sql      初期スキーマ + RLS + triggers
    20260506_exercise_sets.sql  種目セット + トレーナー権限拡張

docs/
  IMPLEMENTATION.md     フェーズ別実装プロンプト
  DESIGN.md             本書

public/avatars/         アバター画像（差し替え予定）

middleware.ts           認証リダイレクト
```

---

## 5. データモデル

### 5.1 ER 図（主要テーブル）

```
auth.users (Supabase)
   │
   ▼
profiles ── role: member/trainer/admin
   │
   ▼
members ── current_xp, current_level
   │
   ├─► avatars (1:1)         name, current_skin, state
   ├─► check_ins (1:N)       date, type, points_awarded
   ├─► weights (1:N)         date, weight_kg
   ├─► trainings (1:N)       date, content, duration_min
   │     │
   │     ├─► exercise_sets   exercise_name, weight, reps, sets
   │     └─► feedbacks       trainer_id, type, content, read_at
   ├─► streaks (1:1)         current_streak, longest_streak
   └─► badges (1:N)          badge_type

設定系（単一行 or マスタ）:
  point_settings        XP レート（管理者編集可）
  level_thresholds      レベル毎の XP 閾値とスキン ID
```

### 5.2 主要テーブル詳細

| テーブル | 主要列 | 備考 |
|---|---|---|
| profiles | id (FK auth.users), role, display_name | 認証ユーザーごとに1行。新規ユーザーは自動作成（trigger） |
| members | user_id, current_xp, current_level | role='member' で自動作成（trigger） |
| avatars | member_id, name, current_skin, state | state: normal / lonely / celebrating |
| check_ins | member_id, date, type, points_awarded | type: personal / self、同日同 type は重複不可 |
| weights | member_id, date, weight_kg | 1日1記録（upsert） |
| trainings | member_id, date, content, duration_min | 同日複数可 |
| exercise_sets | training_id, exercise_name, weight_kg, reps, sets, position | 1トレーニングに複数種目 |
| feedbacks | training_id, trainer_id, type, content, read_at | type: comment / like |
| streaks | member_id, current_streak, longest_streak, last_activity_date | check_ins insert で自動更新 |
| point_settings | (単一行) personal/self/weight/training/like のポイント | 管理者のみ更新可 |
| level_thresholds | level, xp_required, skin_id | 公開読み取りのみ |

### 5.3 XP 計算ロジック（DB 側）

```
[INSERT into check_ins]
  ↓ before trigger (trg_checkin_set_points)
    point_settings から type 別ポイント取得 → points_awarded セット
  ↓ after trigger (trg_checkin_after_insert)
    award_xp() → members.current_xp 加算 → level 再計算 → avatar.skin 更新
    streaks 更新（連続日数）
    avatar.state = 'lonely' なら 'normal' へ復帰

[INSERT into weights] → trg_weight_award_xp → award_xp()
[INSERT into trainings] → trg_training_award_xp → award_xp()
[INSERT into feedbacks (type=like)] → trg_feedback_like_bonus → 対象会員に +5XP
```

---

## 6. セキュリティ設計

### 6.1 Row Level Security

| テーブル | 会員 | トレーナー / 管理者 |
|---|---|---|
| profiles | 自分のみ select/update | 全件 select |
| members | 自分のみ all | 全件 select |
| avatars | 自分のみ all | 全件 select |
| check_ins | 自分のみ all | 全件 select |
| weights | 自分のみ all | 全件 select |
| trainings | 自分のみ all | 全件 all（代理記録のため） |
| exercise_sets | 自分のトレに対してのみ all | 全件 all |
| feedbacks | 自分のトレに紐づくものを select / read_at 更新 | 全件 all |
| point_settings | 読み取りのみ | 管理者のみ更新 |

### 6.2 認証フロー

1. Email + パスワードで Supabase Auth へサインイン
2. 成功すると `sb-*` Cookie が発行され、`@supabase/ssr` がそれを Middleware / RSC / Server Action から読み取り
3. Middleware で未認証ユーザーを `/login` へ強制リダイレクト
4. Server Component / Action 内で `supabase.auth.getUser()` により認証検証

### 6.3 QR チェックイン

- URL 方式: `https://[domain]/checkin/qr?venue=token`
- 本番では env `GYM_VENUE_TOKENS` で許可 token を制限
- カメラ起動方式: ブラウザの MediaDevices API + html5-qrcode
- HTTPS 必須（Vercel ドメインで満たす）

### 6.4 想定リスクと対策

| リスク | 対策 |
|---|---|
| 不正な代理記録 | trainings 書き込み policy で trainer/admin ロールのみ許可、Server Action でも role 再検証 |
| QR 偽造で来店水増し | venue token を環境変数管理。将来的に HMAC 署名つき token に拡張可能 |
| RLS 漏れ | 全テーブルで `enable row level security` を migration で強制、追加テーブルにもチェックリストを適用 |
| XP 改ざん | クライアント計算禁止、すべて DB trigger 経由。`award_xp()` は `security definer` で実行 |

---

## 7. 画面構成 / 主要フロー

### 7.1 会員側

| ルート | 役割 | データ取得 |
|---|---|---|
| `/login` | サインイン（または Demo モード） | - |
| `/onboarding` | 初回のアバター孵化（名前入力） | profiles, avatars |
| `/` | ダッシュボード（アバター + カレンダー + 未読 FB） | avatars, members, check_ins, trainings, feedbacks |
| `/checkin` | パーソナル / 自主トレ ボタン + QR スキャン | - |
| `/checkin/qr?venue=X` | QR 来店記録（URL 直叩き or スキャン経由） | check_ins insert |
| `/weight` | 体重チャート（1M/3M/6M/1Y）+ 入力 + 履歴 | weights |
| `/training` | 種目選択 + 重量×回数×セット 入力 + 履歴 | trainings + exercise_sets + feedbacks |

### 7.2 トレーナー側

| ルート | 役割 | データ取得 |
|---|---|---|
| `/trainer` | 会員一覧（Lv/最終来店/直近体重） | profiles + members + check_ins + weights |
| `/trainer/[memberId]` | 会員詳細 + 代理でトレ記録 + 直近履歴 | profiles + trainings + weights + check_ins |

### 7.3 管理者側（Phase 4）

| ルート | 役割 |
|---|---|
| `/admin/settings` | XP レート編集、レベル分布表示 |

### 7.4 主要フロー

#### チェックインフロー
```
会員: /checkin にアクセス
  → 「パーソナル」ボタン or「QR スキャン」
  → Server Action: check_ins INSERT
    → before trigger: points_awarded セット
    → after trigger: XP 加算 → レベル判定 → avatar.skin 更新 → streak 更新
  → クライアント: members 再取得して current_level 比較
  → レベルアップなら LevelUpModal を表示
  → revalidatePath('/')
```

#### トレーナー代理記録フロー
```
トレーナー: /trainer/[memberId] にアクセス
  → ロールチェック（layout）
  → TrainingForm（onBehalfOf={ user_id, display_name }）
  → 種目 / 重量 / 回数 / セット 入力
  → Server Action: logTraining({ memberId, ... })
    → role 再検証
    → trainings INSERT (member_id = 対象会員) → trg_training_award_xp → +2 XP
    → exercise_sets INSERT
  → revalidatePath
```

---

## 8. 非機能要件

| 項目 | 要件 |
|---|---|
| **モバイル UI** | iPhone SE (375px) で破綻しないこと、PWA としてホーム画面追加可能 |
| **パフォーマンス** | Lighthouse モバイルスコア: パフォーマンス 80+ / PWA 80+ |
| **可用性** | Vercel / Supabase の SLA に準拠（99.9%） |
| **データ保存期間** | 退会後も会員データは保持（手動削除のみ） |
| **同時接続** | 200 ユーザー想定 |
| **ブラウザ対応** | iOS Safari 15+ / Android Chrome 最新 / デスクトップ Chrome / Safari / Edge |
| **国際化** | 日本語のみ |

---

## 9. デプロイ・運用

### 9.1 環境

| 環境 | URL | 用途 |
|---|---|---|
| Production | `https://[gym-name].vercel.app` | 本番運用 |
| Preview | PR ごとに自動発行 | リリース前の動作確認 |
| Local | `localhost:3000` | 開発 |

### 9.2 必要な環境変数

| 変数名 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開キー |
| `GYM_VENUE_TOKENS` | QR 検証用 token のカンマ区切りリスト（任意） |

### 9.3 デプロイ手順

1. Supabase プロジェクト作成、SQL Editor でマイグレーションを順次実行
2. Authentication で Email Provider を有効化、Site URL を Vercel のドメインに設定
3. GitHub リポジトリを Vercel に接続、env vars を設定
4. main ブランチへの push で自動デプロイ
5. 初回のみ管理者ユーザーを Supabase Auth で作成し、SQL Editor で `profiles.role = 'admin'` に更新

### 9.4 運用

- **モニタリング**: Vercel Analytics + Supabase Dashboard
- **ログ**: Vercel Functions ログ（30日保持）
- **バックアップ**: Supabase Daily Backup（Pro プラン）
- **障害対応**: Vercel Slack 通知連携（任意）

---

## 10. リリース計画

### 10.1 フェーズ別タスク

| Phase | 内容 | 状況 |
|---|---|---|
| Phase 0 | Next.js / Supabase / 認証スカフォールド | ✅ 完了 |
| Phase 1 | アバター孵化、チェックイン、XP、月カレンダー | ✅ 完了 |
| Phase 2 | 体重・トレ記録、トレーナー FB 表示 | ✅ 完了 |
| Phase 2.5 | 経営者フィードバック反映（カレンダー強化・種目検索・QR・トレーナー画面） | ✅ 完了 |
| Phase 3 | トレーナー FB 投稿、いいね、未読管理の本番化 | 🚧 半分完了 |
| Phase 4 | ストリーク表示、寂しいアバター演出、PWA 化、管理者設定、オンボーディングアニメ | ⬜ 未着手 |
| Phase 5（将来） | LINE 連携、写真投稿、目標管理、会員間ランキング、複数店舗対応 | ⬜ 別契約 |

### 10.2 残作業の見積もり

| 作業 | 工数（人日） |
|---|---|
| Phase 3 完了（FB 投稿フォーム / 未読同期） | 3〜5 日 |
| Phase 4 全体 | 7〜10 日 |
| アバター画像 10レベル分の制作 | 3〜5 日（外注想定） |
| 種目アイコン整備（60種目分） | 2〜3 日 |
| QR token ローテーション仕様 | 1〜2 日 |
| Supabase 本番セットアップ + マイグレーション適用 | 1 日 |
| Vercel 本番セットアップ + 環境変数 | 0.5 日 |
| 受け入れテスト・修正バッファ | 3〜5 日 |
| **合計** | **20〜30 人日** |

---

## 11. 制限事項・前提条件

- iOS Safari の Web Push は限定対応（PWA をホーム画面に追加した場合のみ動作。iOS 16.4 以降）
- カメラ起動 QR は HTTPS 必須（localhost / Vercel ドメインは OK）
- Supabase 無料枠: 同時接続 200、ストレージ 1GB、データ転送 5GB/月。会員 100 名規模なら十分。超過時は Pro プラン（$25/月）
- マイグレーションはローカル開発時は手動 SQL 実行（`supabase` CLI を導入すれば自動化可能）

---

## 12. 今後のロードマップ（提案）

| 時期 | 内容 |
|---|---|
| MVP リリース直後 | 会員 5〜10 名で先行運用、フィードバック収集 |
| +1〜2ヶ月 | Phase 4 完了（PWA push、ストリーク、寂しいアバター） |
| +3ヶ月 | 経営者ダッシュボード（継続率・来店数・体重変化の集計） |
| +6ヶ月 | LINE 連携、種目カスタマイズ画面 |
| +1年〜 | 2店舗目展開時のマルチテナント化検討 |

---

## 13. 設計判断のログ

| 判断 | 理由 |
|---|---|
| ネイティブアプリではなく PWA | 初期コスト削減、配信ストア審査不要、Web Push で通知も可能 |
| Supabase 採用 | Auth / DB / RLS / Storage を1つで完結、初期費用ゼロから始められる |
| XP 計算を DB trigger に閉じ込め | クライアント計算は改ざんリスク、ロジックの一元管理 |
| Server Actions 優先・API ルート禁止 | App Router の RSC とフォームの統合がシンプル |
| デモモード（env 未設定で自動切替） | 営業デモ・PR プレビュー・受け入れテストで便利 |
| アバターは退化させない | リテンション設計の根幹。挫折感を与えると逆効果 |
| 入力は選択式優先 | 会員側の入力負担を最小化するため |
| 種目カタログを `lib/exercises.ts` に集約 | DB 化は管理画面が必要、初期は静的でも十分 |

---

## 14. 用語集

| 用語 | 意味 |
|---|---|
| 会員 (member) | パーソナルジムに通うユーザー。アプリを最も使う |
| トレーナー (trainer) | パーソナルセッションを行う指導者。会員のトレを代理記録できる |
| 管理者 (admin) | ジム経営者。トレーナーの権限に加え XP レートを編集できる |
| パーソナル | トレーナー付きセッション。来店時にチェックイン |
| 自主トレ | トレーナー無しの自主練習。自宅やジムで記録のみ |
| XP | 経験値。レベルアップに必要なポイント |
| ストリーク | 連続出席日数 |
| 寂しいアバター | 7日連続でチェックインがないとアバターが「lonely」状態になる演出 |
| ボリューム | 重量 × 回数 × セット数の総和。トレーニング負荷の指標 |
