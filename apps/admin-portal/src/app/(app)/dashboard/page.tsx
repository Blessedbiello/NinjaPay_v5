"use client";

import { StatCard } from '@/components/ui/stat-card';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { useAdminOverview } from '@/lib/hooks';
import { TimeSeriesCard } from '@/components/charts/timeseries-card';

const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat('en-US', options).format(value);

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export default function DashboardPage() {
  const { data, isLoading } = useAdminOverview();

  const metrics = data?.metrics;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold">Command Center</h2>
        <p className="text-sm text-muted-foreground">
          Live overview of confidentiality services, merchant activity and platform health.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Encrypted TPS"
            value={metrics ? formatNumber(metrics.encryptedTps) : '—'}
            change={
              metrics
                ? `${metrics.tpsDelta >= 0 ? '+' : ''}${formatPercent(metrics.tpsDelta)} vs last hour`
                : undefined
            }
            intent={metrics && metrics.tpsDelta >= 0 ? 'success' : 'critical'}
            icon={<DynamicIcon name="bolt" className="h-4 w-4 text-primary" />}
          />
          <StatCard
            title="Outstanding Alerts"
            value={metrics ? formatNumber(metrics.openAlerts) : '—'}
            change={metrics ? `${formatNumber(metrics.ackNeeded)} need acknowledgment` : undefined}
            intent={metrics && metrics.ackNeeded > 0 ? 'warning' : undefined}
            icon={<DynamicIcon name="alert-triangle" className="h-4 w-4 text-secondary" />}
          />
          <StatCard
            title="Arcium MPC Latency"
            value={metrics ? `${formatNumber(metrics.arciumLatencyP95)}ms p95` : '—'}
            change={metrics ? `${formatPercent(metrics.latencyDelta)} vs baseline` : undefined}
            intent={metrics && metrics.latencyDelta <= 0 ? 'success' : 'critical'}
            icon={<DynamicIcon name="timer" className="h-4 w-4 text-muted-foreground" />}
          />
          <StatCard
            title="Treasury Net Flows"
            value={
              metrics
                ? `${metrics.netFlows < 0 ? '-' : ''}${formatNumber(Math.abs(metrics.netFlows) / 1000, {
                    maximumFractionDigits: 0,
                  })}k USDC`
                : '—'
            }
            change={metrics?.treasuryNote}
            intent={metrics && metrics.netFlows < 0 ? 'critical' : 'success'}
            icon={<DynamicIcon name="arrow-down-right" className="h-4 w-4 text-destructive" />}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Active Incidents</h3>
              <p className="text-xs text-muted-foreground">Ops playbook assignments and escalation paths.</p>
            </div>
            <DynamicIcon name="shield-check" className="h-4 w-4 text-secondary" />
          </div>
          <div className="space-y-3">
            {(data?.incidents ?? []).map((incident) => (
              <div
                key={incident.id}
                className="rounded-xl border border-border/40 bg-background/60 p-4 transition hover:border-primary/40"
              >
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>{incident.id}</span>
                  <span
                    className={
                      incident.severity === 'high'
                        ? 'rounded-full bg-destructive/10 px-2 py-0.5 text-destructive'
                        : 'rounded-full bg-secondary/10 px-2 py-0.5 text-secondary'
                    }
                  >
                    {incident.severity.toUpperCase()}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">{incident.title}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{incident.owner}</span>
                  <span>{new Date(incident.detectedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {isLoading && !data?.incidents && (
              <div className="rounded-xl border border-border/40 bg-background/60 p-4 text-xs text-muted-foreground">
                Loading incidents…
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5 lg:col-span-2">
          <div>
            <h3 className="text-sm font-semibold">Next Actions</h3>
            <p className="text-xs text-muted-foreground">
              High-impact tasks requiring multi-sig or human approval.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {(data?.tasks ?? []).map((task) => (
              <li key={task.id} className="rounded-xl border border-border/40 bg-background/60 p-4">
                <p className="font-medium">{task.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(task.due).toLocaleString()}</p>
              </li>
            ))}
            {isLoading && !data?.tasks && (
              <li className="rounded-xl border border-border/40 bg-background/60 p-4 text-xs text-muted-foreground">
                Loading tasks…
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/70">
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">Service Uptime</h3>
            <p className="text-xs text-muted-foreground">Heartbeat metrics across critical infrastructure.</p>
          </div>
          <DynamicIcon name="server" className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border/40">
          {(data?.uptime ?? []).map((service) => (
            <div key={service.name} className="flex items-center justify-between px-5 py-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-accent animation-pulse-soft" />
                <span className="font-medium">{service.name}</span>
              </div>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span>{service.status}</span>
                <span>{service.latency}ms</span>
              </div>
            </div>
          ))}
          {isLoading && !data?.uptime && (
            <div className="px-5 py-6 text-sm text-muted-foreground">Loading platform metrics…</div>
          )}
        </div>
      </section>

      <TimeSeriesCard data={data?.timeline ?? []} />
    </div>
  );
}
