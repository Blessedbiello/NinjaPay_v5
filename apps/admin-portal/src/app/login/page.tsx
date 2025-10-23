"use client";

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border/50 bg-card/70 p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold">Admin Portal Access</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your NinjaPay operations email. We&apos;ll send a magic link while SSO wiring is underway.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!email) {
              setError('Please enter a valid email.');
              return;
            }
            setError(null);
            document.cookie = `admin_session=dev-session-token; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
            setSubmitted(true);
            setTimeout(() => {
              window.location.href = redirect;
            }, 600);
          }}
        >
          <label className="flex flex-col space-y-2 text-sm font-medium text-muted-foreground">
            Work email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ops@ninjapay.xyz"
              className="h-11 rounded-xl border border-border bg-background/80 px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
              type="email"
              required
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-sm font-medium text-primary transition hover:bg-primary/15"
          >
            Send magic link
          </button>
        </form>
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
        {submitted && (
          <div className="rounded-xl border border-border/60 bg-background/80 p-4 text-xs text-muted-foreground">
            Session established for <strong>{email}</strong>. Redirecting to&nbsp;
            <span className="text-foreground">{redirect}</span>.
          </div>
        )}
        <p className="text-center text-xs text-muted-foreground">
          Redirect after login:&nbsp;
          <span className="text-foreground">{redirect}</span>
        </p>
      </div>
    </div>
  );
}
