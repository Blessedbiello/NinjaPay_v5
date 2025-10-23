"use client";

import { useAdminRiskAlerts } from '@/lib/hooks';

export default function RiskPage() {
  const { data, isLoading } = useAdminRiskAlerts();
  const alerts = data?.alerts ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Risk & Compliance Center</h2>
        <p className="text-sm text-muted-foreground">
          Consolidated view of automated risk scores, confidential payment anomalies, and escalations to human ops.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-2xl border border-border/60 bg-card/70 p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{alert.id}</span>
              <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-secondary">{alert.status}</span>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold">{alert.type}</p>
              <p className="text-xs text-muted-foreground">{alert.entity}</p>
              <p className="text-xs font-medium text-destructive">Risk score: {alert.score}</p>
              <p className="text-xs text-muted-foreground">Detected: {alert.detectedAt ? new Date(alert.detectedAt).toLocaleString() : '—'}</p>
            </div>
          </div>
        ))}
        {isLoading && alerts.length === 0 && (
          <div className="rounded-2xl border border-border/60 bg-card/70 p-5 text-sm text-muted-foreground">
            Loading risk alerts…
          </div>
        )}
      </div>    </div>
  );
}

