"use client";

import { useRouter } from "next/navigation";
import { useCallback, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type AuthMode = "email" | "username";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailId = useId();
  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();

  const handleEmailSignIn = useCallback(
    async (formData: FormData) => {
      setError(null);
      setLoading(true);

      const email = (formData.get("email") as string)?.trim();
      const password = (formData.get("password") as string) ?? "";

      if (!email || !password) {
        setError("Email and password are both required.");
        setLoading(false);
        return;
      }

      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message ?? "Sign-in failed. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/account");
      router.refresh();
    },
    [router],
  );

  const handleUsernameSignIn = useCallback(
    async (formData: FormData) => {
      setError(null);
      setLoading(true);

      const username = (formData.get("username") as string)?.trim();
      const password = (formData.get("password") as string) ?? "";

      if (!username || !password) {
        setError("Username and password are both required.");
        setLoading(false);
        return;
      }

      const result = await authClient.signIn.username({
        username,
        password,
      });

      if (result.error) {
        setError(result.error.message ?? "Sign-in failed. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/account");
      router.refresh();
    },
    [router],
  );

  return (
    <div className="mx-auto grid max-w-md gap-6 py-8">
      <Card className="grid gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sign in to Teamsster
        </h1>
        <p className="text-sm text-slate-600">
          Use your email or username to sign in.
        </p>
      </Card>

      {/* Auth mode tabs */}
      <div
        aria-label="Sign-in method"
        className="flex gap-1 rounded-2xl bg-slate-100 p-1"
        role="tablist"
      >
        <button
          aria-controls="email-panel"
          aria-selected={mode === "email"}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            mode === "email"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          id="email-tab"
          onClick={() => {
            setMode("email");
            setError(null);
          }}
          role="tab"
          type="button"
        >
          Email
        </button>
        <button
          aria-controls="username-panel"
          aria-selected={mode === "username"}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            mode === "username"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          id="username-tab"
          onClick={() => {
            setMode("username");
            setError(null);
          }}
          role="tab"
          type="button"
        >
          Username
        </button>
      </div>

      {/* Error banner */}
      {error ? (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          id={errorId}
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {/* Email sign-in */}
      <div
        aria-labelledby="email-tab"
        hidden={mode !== "email"}
        id="email-panel"
        role="tabpanel"
      >
        <Card>
          <form action={handleEmailSignIn} className="grid gap-4">
            <div className="grid gap-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor={emailId}
              >
                Email address
              </label>
              <Input
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? "true" : undefined}
                autoComplete="email"
                id={emailId}
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor={`${passwordId}-email`}
              >
                Password
              </label>
              <Input
                autoComplete="current-password"
                id={`${passwordId}-email`}
                minLength={8}
                name="password"
                required
                type="password"
              />
            </div>
            <Button disabled={loading} type="submit">
              {loading ? "Signing in..." : "Sign in with email"}
            </Button>
          </form>
        </Card>
      </div>

      {/* Username sign-in */}
      <div
        aria-labelledby="username-tab"
        hidden={mode !== "username"}
        id="username-panel"
        role="tabpanel"
      >
        <Card>
          <form action={handleUsernameSignIn} className="grid gap-4">
            <div className="grid gap-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor={usernameId}
              >
                Username
              </label>
              <Input
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? "true" : undefined}
                autoComplete="username"
                id={usernameId}
                name="username"
                placeholder="player_one"
                required
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor={`${passwordId}-username`}
              >
                Password
              </label>
              <Input
                autoComplete="current-password"
                id={`${passwordId}-username`}
                minLength={8}
                name="password"
                required
                type="password"
              />
            </div>
            <Button disabled={loading} type="submit">
              {loading ? "Signing in..." : "Sign in with username"}
            </Button>
          </form>
        </Card>
      </div>

      <p className="text-center text-xs text-slate-500">
        Minor accounts use a username provided by a parent or guardian. Adults
        can sign in with either method.
      </p>
    </div>
  );
}
