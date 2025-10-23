"use client";

import { useAdminAgents } from '@/lib/hooks';

export default function AgentsPage() {
  const { data, isLoading } = useAdminAgents();
  const agents = data?.agents ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">AI Agent Orchestration</h2>
        <p className="text-sm text-muted-foreground">
          Monitor task queues, heartbeat freshness, and latest executions across all autonomous agents.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <div key={agent.id} className="rounded-2xl border border-border/60 bg-card/70 p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{agent.name}</span>
              <span
                className={
                  agent.status && agent.status.toLowerCase().includes('running')
                    ? 'rounded-full bg-accent/10 px-2 py-0.5 text-accent'
                    : 'rounded-full bg-destructive/10 px-2 py-0.5 text-destructive'
                }
              >
                {agent.status}
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-medium">Queue depth: {agent.queueDepth}</p>
              <p className="text-xs text-muted-foreground">
                Last heartbeat: {agent.lastHeartbeat ? new Date(agent.lastHeartbeat).toLocaleTimeString() : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Last run: {agent.lastRun ?? '—'}</p>
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <button className="rounded-full border border-border px-3 py-1 text-muted-foreground transition hover:border-primary hover:text-primary">
                View logs
              </button>
              <button className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary transition hover:bg-primary/15">
                Restart
              </button>
            </div>
          </div>
        ))}
        {isLoading && agents.length === 0 && (
          <div className="rounded-2xl border border-border/60 bg-card/70 p-5 text-sm text-muted-foreground">
            Loading agent telemetry…
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
        Planned integration: connect to `services/ai-orchestrator` WebSocket feed for live task events and manual overrides.
      </div>
    </div>
  );
}
