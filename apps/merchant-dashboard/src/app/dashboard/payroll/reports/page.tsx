'use client';

import { FileText, Download, TrendingUp, DollarSign, Users } from 'lucide-react';

const mockReports = [
  {
    id: '1',
    period: 'September 2025',
    totalAmount: '142,500',
    payments: 43,
    employees: 12,
    date: '2025-09-30',
  },
  {
    id: '2',
    period: 'August 2025',
    totalAmount: '138,200',
    payments: 41,
    employees: 11,
    date: '2025-08-31',
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Payroll Reports</h1>
          <p className="text-muted-foreground">
            View and export payroll analytics
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-accent-400" />
            <p className="text-sm text-muted-foreground">Total Paid (YTD)</p>
          </div>
          <p className="text-2xl font-bold text-accent-400">$1.4M</p>
          <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +12% vs last year
          </p>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-accent-400" />
            <p className="text-sm text-muted-foreground">Total Payments</p>
          </div>
          <p className="text-2xl font-bold text-accent-400">487</p>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-accent-400" />
            <p className="text-sm text-muted-foreground">Avg per Payment</p>
          </div>
          <p className="text-2xl font-bold text-accent-400">$2,875</p>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-accent-400" />
            <p className="text-sm text-muted-foreground">Reports Generated</p>
          </div>
          <p className="text-2xl font-bold text-accent-400">{mockReports.length}</p>
        </div>
      </div>

      {/* Monthly Reports */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Monthly Reports</h3>
          <button className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export All
          </button>
        </div>

        <div className="space-y-3">
          {mockReports.map((report) => (
            <div
              key={report.id}
              className="p-5 bg-dark-card border border-dark-border rounded-lg hover:border-accent-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-3">{report.period}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                      <p className="font-semibold text-accent-400">${report.totalAmount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Payments</p>
                      <p className="font-semibold">{report.payments}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Employees</p>
                      <p className="font-semibold">{report.employees}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-6">
                  <button className="px-4 py-2 bg-accent-600/20 hover:bg-accent-600/30 text-accent-400 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    View Report
                  </button>
                  <button className="px-4 py-2 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download CSV
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="glass-card">
        <h3 className="font-semibold mb-4">Payment Trends</h3>
        <div className="h-64 bg-dark-card border border-dark-border rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Payment analytics chart coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
