"use client";

import { useAdminLedgers } from '@/lib/hooks';

export default function TreasuryPage() {
  const { data, isLoading } = useAdminLedgers();
  const ledgers = data?.ledgers ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Treasury Oversight</h2>
        <p className="text-sm text-muted-foreground">
          Snapshot of multi-sig balances, hedged positions, and large-movement alerts.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ledgers.map((ledger) => (
          <div key={ledger.id} className="rounded-2xl border border-border/60 bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">{ledger.description}</p>
            <p className="mt-3 text-xl font-semibold">
              {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(ledger.balance)} {ledger.id}
            </p>
            <p className={`mt-1 text-xs ${ledger.trend >= 0 ? 'text-accent' : 'text-destructive'}`}>
              Change: {(ledger.trend * 100).toFixed(1)}%
            </p>
          </div>
        ))}
        {isLoading && ledgers.length === 0 && (
          <div className="rounded-2xl border border-border/60 bg-card/70 p-5 text-sm text-muted-foreground">
            Loading treasury balances…
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
        Future integration: link with treasury service to approve manual overrides, configure payout circuit breakers, and
        export ledger reconciliation packages.
      </div>
    </div>
  );
}

