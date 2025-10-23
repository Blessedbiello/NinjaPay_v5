"use client";

import { ReactNode } from 'react';
import clsx from 'clsx';

type StatCardProps = {
  title: string;
  value: string;
  change?: string;
  icon?: ReactNode;
  intent?: 'success' | 'warning' | 'critical';
};

export function StatCard({ title, value, change, icon, intent }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-5 shadow dark:shadow-none">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      {change && (
        <span
          className={clsx(
            'text-xs font-medium',
            intent === 'critical' && 'text-destructive',
            intent === 'warning' && 'text-secondary',
            intent === 'success' && 'text-accent',
            !intent && 'text-muted-foreground'
          )}
        >
          {change}
        </span>
      )}
    </div>
  );
}

