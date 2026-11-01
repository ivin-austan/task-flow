import { useState, type FormEvent } from "react";
import { CheckSquare2 } from "lucide-react";
import { registerAccount, signIn } from "../../services/auth.api";
import type { AuthUser } from "../../types/auth.types";

interface AuthPageProps {
  onSignIn: (user: AuthUser) => void;
  verificationMessage: string | null;
}

export function AuthPage({
  onSignIn,
  verificationMessage,
}: AuthPageProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        setMessage(await registerAccount(email, password));
      } else {
        onSignIn(await signIn(email, password));
      }
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The account request failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeMode(next: "signin" | "signup"): void {
    setMode(next);
    setMessage(null);
    setError(null);
  }

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-indigo-600 text-white">
            <CheckSquare2 size={22} />
          </div>
          <div>
            <p className="font-bold tracking-tight text-slate-950">Taskflow</p>
            <p className="text-xs text-slate-500">Your personal workspace</p>
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {mode === "signin"
            ? "Sign in to manage your tasks and receive email alerts."
            : "We’ll send a verification link to your email before you can sign in."}
        </p>

        {(verificationMessage || message) && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {message ?? verificationMessage}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={mode === "signup" ? 8 : 1}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
            />
            {mode === "signup" && (
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Use at least 8 characters.
              </span>
            )}
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting
              ? "Please wait..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === "signin" ? "New to Taskflow?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => changeMode(mode === "signin" ? "signup" : "signin")}
            className="font-semibold text-indigo-700 hover:text-indigo-800"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </section>
    </main>
  );
}
