'use client';

import { useState } from 'react';
import { Search, Users, TrendingUp, DollarSign, Mail, Wallet } from 'lucide-react';
import { formatCurrency, formatDate, shortenHash } from '@/lib/utils';

// Mock data
const mockCustomers = [
  {
    id: 'cus_abc123',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    walletAddress: '7xJ8kL9pMnQ2rStU3vWx4yZ5a',
    totalSpent: 1247.50,
    paymentCount: 8,
    lastPayment: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'active',
  },
  {
    id: 'cus_def456',
    name: 'Bob Smith',
    email: 'bob@startup.io',
    walletAddress: '5Hp6nL7qMoP8rStU9vWx0yZ1b',
    totalSpent: 2899.99,
    paymentCount: 12,
    lastPayment: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'active',
  },
  {
    id: 'cus_ghi789',
    name: 'Carol Davis',
    email: 'carol@dao.xyz',
    walletAddress: '3Fq4mK5nLoM6pRsT7uVw8xY9c',
    totalSpent: 599.99,
    paymentCount: 3,
    lastPayment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    status: 'active',
  },
  {
    id: 'cus_jkl012',
    name: 'Dave Wilson',
    email: 'dave@protocol.com',
    walletAddress: '9Tr2sL3pMoN4qRsU5vWx6yZ7d',
    totalSpent: 149.99,
    paymentCount: 1,
    lastPayment: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    status: 'inactive',
  },
];

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = mockCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSpent = mockCustomers.reduce((acc, c) => acc + c.totalSpent, 0);
  const activeCustomers = mockCustomers.filter((c) => c.status === 'active').length;
  const avgSpent = totalSpent / mockCustomers.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer relationships and payment history
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{mockCustomers.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeCustomers}</p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-secondary-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
              <span className="text-lg font-bold text-accent-400">Ø</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(avgSpent)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or wallet address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-dark-card border border-dark-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="glass-card card-hover">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-white">
                  {customer.name.charAt(0)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {customer.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  </div>
                  {customer.status === 'active' ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Wallet */}
                <div className="flex items-center gap-2 mb-3 p-2 bg-dark-card rounded-lg">
                  <Wallet className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {shortenHash(customer.walletAddress, 8)}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-dark-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="font-semibold">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payments</p>
                    <p className="font-semibold">{customer.paymentCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Payment</p>
                    <p className="font-semibold text-xs">
                      {formatDate(customer.lastPayment).split(',')[0]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="glass-card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No customers found</h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Your customers will appear here once they make a payment'}
          </p>
        </div>
      )}
    </div>
  );
}
