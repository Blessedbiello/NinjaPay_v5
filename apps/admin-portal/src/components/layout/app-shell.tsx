"use client";

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex w-full flex-col">
        <TopNav />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

