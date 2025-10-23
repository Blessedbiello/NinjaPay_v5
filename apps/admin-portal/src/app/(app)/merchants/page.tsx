"use client";

import Link from 'next/link';
import { useAdminMerchants } from '@/lib/hooks';
import clsx from 'clsx';

export default function MerchantsPage() {
  const { data, isLoading } = useAdminMerchants();
  const merchants = data?.merchants ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Merchant Directory</h2>
        <p className="text-sm text-muted-foreground">
          Manage KYC state, velocity limits, and access to confidential payment features.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70">
        <table className="min-w-full divide-y divide-border/40 text-sm">
          <thead className="bg-background/60 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Merchant</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">KYC</th>
              <th className="px-4 py-3 text-left font-medium">Risk</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {merchants.map((merchant) => (
              <tr key={merchant.id} className="hover:bg-background/50">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{merchant.name}</span>
                    <span className="text-xs text-muted-foreground">{merchant.id}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">{merchant.status}</td>
                <td className="px-4 py-3 text-xs">{merchant.kyc}</td>
                <td
                  className={clsx(
                    'px-4 py-3 text-xs',
                    merchant.risk === 'Critical' && 'text-destructive',
                    merchant.risk === 'Moderate' && 'text-secondary'
                  )}
                >
                  {merchant.risk}
                </td>
                <td className="px-4 py-3 text-xs">{merchant.createdAt ? new Date(merchant.createdAt).toLocaleDateString() : '\u2014'}</td>
                <td className="px-4 py-3 text-right text-xs">
                  <Link href={`/merchants/${merchant.id}`} className="text-primary underline-offset-4 hover:underline">
                    View profile
                  </Link>
                </td>
              </tr>
            ))}
            {isLoading && merchants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Loading merchants…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

