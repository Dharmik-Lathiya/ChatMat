"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/services/auth";
import { friendlyError } from "@/lib/firebase/errors";
import { Button, Input, Alert } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-ink-50 to-sky-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold text-white">
            C
          </div>
          <h1 className="text-2xl font-bold text-ink-900">Reset password</h1>
          <p className="mt-1 text-sm text-ink-500">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-card">
          {sent ? (
            <Alert tone="success">
              Check your inbox for a password reset link.
            </Alert>
          ) : (
            <>
              {error && (
                <Alert tone="error" key={error}>
                  {error}
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" loading={loading} className="w-full">
                  Send Reset Link
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-ink-500">
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
