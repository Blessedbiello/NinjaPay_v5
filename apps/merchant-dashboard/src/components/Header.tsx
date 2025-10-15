'use client';

import { Bell, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 border-b border-dark-border glass sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions, customers..."
              className="w-full h-10 pl-10 pr-4 bg-dark-card border border-dark-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-primary-500/10 transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-secondary-500 rounded-full"></span>
          </button>

          {/* Network Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-glow"></div>
            <span className="text-xs font-medium text-green-400">
              Solana Devnet
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
