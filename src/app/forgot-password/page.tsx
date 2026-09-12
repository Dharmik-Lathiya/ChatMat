"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/services/auth";
import { friendlyError } from "@/lib/firebase/errors";
import { Button, Input, Alert } from "@/components/ui";
import { ChatmatLogo } from "@/components/ChatmatLogo";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-ink-50 to-sky-50 px-4 dark:from-gray-950 dark:via-black dark:to-gray-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <ChatmatLogo />
          </div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Reset password</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-gray-400">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-card dark:border-gray-800 dark:bg-gray-900">
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
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-gray-400">
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

        <p className="mt-4 text-center text-sm text-ink-500 dark:text-gray-400">
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-500 dark:hover:text-brand-400">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
