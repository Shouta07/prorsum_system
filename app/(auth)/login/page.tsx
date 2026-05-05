import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-zinc-50">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900">GymQuest</h1>
          <p className="mt-1 text-sm text-zinc-500">ログインして、相棒を育てよう</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
