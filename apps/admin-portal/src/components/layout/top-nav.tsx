"use client";

import { useTheme } from 'next-themes';
import { NAVIGATION } from '@/lib/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { Bell, MoonStar, SunMedium } from 'lucide-react';
import { useState, useMemo } from 'react';

export function TopNav() {
  const pathname = usePathname();
  const active = useMemo(() => NAVIGATION.find((item) => pathname.startsWith(item.href)), [pathname]);
  const { resolvedTheme, setTheme } = useTheme();
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/75 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        {active ? (
          <>
            <DynamicIcon name={active.icon} className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">{active.title}</p>
              <p className="text-xs text-muted-foreground">{active.description}</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a module to get started.</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setAcknowledged(true)}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          aria-label="View alerts"
        >
          <Bell className="h-4 w-4" />
          {!acknowledged && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" aria-hidden />
          )}
        </button>
        <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground md:flex">
          Environment:{' '}
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Development</span>
        </div>
        <Link
          href="/settings"
          className="hidden rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-medium text-primary transition hover:bg-primary/15 md:inline-flex"
        >
          Ops Playbooks
        </Link>
      </div>
    </header>
  );
}
