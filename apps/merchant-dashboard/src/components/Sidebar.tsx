'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CreditCard,
  Package,
  Users,
  Link2,
  Code,
  Settings,
  Wallet,
  Shield,
  Send,
  QrCode,
  Receipt,
  ArrowDownToLine,
  UserCog,
  Calendar,
  FileText,
  Store,
} from 'lucide-react';

const navigation = {
  wallet: [
    { name: 'Send Money', href: '/dashboard/wallet/send', icon: Send },
    { name: 'Receive', href: '/dashboard/wallet/receive', icon: ArrowDownToLine },
    { name: 'Transactions', href: '/dashboard/wallet/transactions', icon: Receipt },
    { name: 'QR Scanner', href: '/dashboard/wallet/qr', icon: QrCode },
  ],
  merchant: [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Payment Links', href: '/dashboard/payment-links', icon: Link2 },
    { name: 'Developers', href: '/dashboard/developers', icon: Code },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  payroll: [
    { name: 'Batch Payroll', href: '/dashboard/payroll/batch', icon: Users },
    { name: 'Employees', href: '/dashboard/payroll/employees', icon: UserCog },
    { name: 'Schedules', href: '/dashboard/payroll/schedules', icon: Calendar },
    { name: 'Reports', href: '/dashboard/payroll/reports', icon: FileText },
  ],
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 h-screen bg-dark-card border-r border-dark-border">
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-dark-border">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold gradient-text">NinjaPay</h1>
          <p className="text-xs text-muted-foreground">Merchant Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {/* Mobile Wallet Section */}
        <div>
          <div className="flex items-center gap-2 px-3 mb-3">
            <Wallet className="w-4 h-4 text-secondary-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-400">
              Mobile Wallet
            </h3>
          </div>
          <div className="h-px bg-gradient-to-r from-secondary-500/50 via-secondary-500/20 to-transparent mb-3"></div>
          <div className="space-y-1">
            {navigation.wallet.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-secondary-500/20 text-secondary-400 neon-pink'
                      : 'text-muted-foreground hover:bg-secondary-500/10 hover:text-secondary-400'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Merchant Dashboard Section */}
        <div>
          <div className="flex items-center gap-2 px-3 mb-3">
            <Store className="w-4 h-4 text-primary-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-400">
              Merchant Dashboard
            </h3>
          </div>
          <div className="h-px bg-gradient-to-r from-primary-500/50 via-primary-500/20 to-transparent mb-3"></div>
          <div className="space-y-1">
            {navigation.merchant.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary-500/20 text-primary-400 neon-purple'
                      : 'text-muted-foreground hover:bg-primary-500/10 hover:text-primary-400'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Payroll System Section */}
        <div>
          <div className="flex items-center gap-2 px-3 mb-3">
            <Users className="w-4 h-4 text-accent-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent-400">
              Payroll System
            </h3>
          </div>
          <div className="h-px bg-gradient-to-r from-accent-500/50 via-accent-500/20 to-transparent mb-3"></div>
          <div className="space-y-1">
            {navigation.payroll.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-accent-500/20 text-accent-400 neon-cyan'
                      : 'text-muted-foreground hover:bg-accent-500/10 hover:text-accent-400'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Privacy Badge */}
      <div className="p-4 border-t border-dark-border">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-semibold text-primary-400">
              Privacy Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            All amounts encrypted with Arcium MPC
          </p>
        </div>
      </div>

      {/* Account */}
      <div className="p-4 border-t border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Merchant Account</p>
            <p className="text-xs text-muted-foreground truncate">
              7xJ8...abc
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
