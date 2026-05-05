# GymQuest

パーソナルジム会員のためのアバター育成型エンゲージメントアプリ。

## 開発状況

- [x] Phase 0: 認証・ログイン・ダッシュボード骨格
- [x] Phase 1: アバター孵化・チェックイン・XP/レベル・月カレンダー
- [ ] Phase 2: 体重・トレーニング記録
- [ ] Phase 3: トレーナー画面
- [ ] Phase 4: ストリーク・PWA・管理者設定

仕様詳細: [`CLAUDE.md`](./CLAUDE.md), [`docs/IMPLEMENTATION.md`](./docs/IMPLEMENTATION.md)

## セットアップ

### 1. Supabase プロジェクト

1. [supabase.com](https://supabase.com) で新規プロジェクト作成
2. Project Settings → API から `Project URL` と `anon public key` を控える
3. SQL Editor で [`supabase/migrations/20260505_initial.sql`](./supabase/migrations/20260505_initial.sql) を全文ペーストして実行
4. Authentication → Providers → Email を有効化（"Confirm email" は開発中はオフ推奨）
5. Authentication → Users → "Add user" でテスト用会員アカウントを作成
6. （任意）SQL Editor で対象ユーザーをトレーナー/管理者に昇格:
   ```sql
   update profiles set role = 'trainer' where id = '<user-uuid>';
   ```

### 2. ローカル開発

```bash
cp .env.local.example .env.local
# .env.local に Supabase の URL と anon key を記入

npm install
npm run dev
```

http://localhost:3000 にアクセス → /login → ログイン → アバター孵化 → ダッシュボード。

### 3. Vercel へのデプロイ

1. GitHub にリポジトリを push
2. [vercel.com](https://vercel.com) で "New Project" → このリポジトリを選択
3. Environment Variables に以下を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Supabase Authentication → URL Configuration の "Site URL" にデプロイ後の Vercel URL を登録すること（メール認証リンクの宛先）。

## 既知の制約・TODO

- `lib/types/database.ts` は手書きの暫定型。ローカル Supabase が立ち上がる環境では
  `npx supabase gen types typescript --local > lib/types/database.ts` で再生成すること。
- アバター画像は `components/avatar/AvatarImage.tsx` のインライン SVG プレースホルダ。
  本番では `/public/avatars/level-1.png` 〜 `level-10.png` を配置しコンポーネントを差し替え。
- shadcn/ui 未導入（Button/Input/Label は手書き）。レジストリ使用可能になり次第差し替え。
- Next.js は `create-next-app@latest` 経由で **16.x** がインストールされる。
  Spec は 15 だが App Router 互換のため動作する（`middleware.ts` は 16 で `proxy.ts` 推奨という非推奨警告のみ）。

## スクリプト

| コマンド | 動作 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLint |
