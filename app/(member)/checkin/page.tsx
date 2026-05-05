import { CheckinButtons } from "./checkin-buttons";

export default function CheckinPage() {
  return (
    <main className="flex flex-col gap-6 px-5 py-6">
      <header>
        <h1 className="text-xl font-bold text-zinc-900">今日の記録</h1>
        <p className="mt-1 text-sm text-zinc-500">タップで XP がもらえるよ</p>
      </header>
      <CheckinButtons />
    </main>
  );
}
