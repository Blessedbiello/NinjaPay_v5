"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAVIGATION } from '@/lib/navigation';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import clsx from 'clsx';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card/60 backdrop-blur lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
          <DynamicIcon name="command" className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide">NinjaPay Ops</p>
          <p className="text-xs text-muted-foreground">Admin Control Center</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {NAVIGATION.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-start gap-3 rounded-xl border border-transparent px-3 py-2 transition-colors',
                active
                  ? 'bg-primary/10 text-primary border-primary/40'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >
              <DynamicIcon name={item.icon} className="mt-0.5 h-4 w-4" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="border-t px-4 py-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} NinjaPay. All activity is monitored & logged.
      </div>
    </aside>
  );
}
