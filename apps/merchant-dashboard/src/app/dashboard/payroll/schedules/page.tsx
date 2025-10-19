'use client';

import { Calendar, Plus, Clock, CheckCircle2 } from 'lucide-react';

const mockSchedules = [
  {
    id: '1',
    name: 'Monthly Salary',
    frequency: 'Monthly',
    nextRun: '2025-11-01',
    employees: 12,
    amount: '65000',
    status: 'active',
  },
  {
    id: '2',
    name: 'Contractor Payments',
    frequency: 'Weekly',
    nextRun: '2025-10-23',
    employees: 5,
    amount: '8500',
    status: 'active',
  },
];

export default function SchedulesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Payment Schedules</h1>
            <p className="text-muted-foreground">
              Automate recurring payroll payments
            </p>
          </div>
        </div>

        <button className="px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Schedule
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card">
          <p className="text-sm text-muted-foreground mb-1">Active Schedules</p>
          <p className="text-3xl font-bold text-accent-400">{mockSchedules.length}</p>
        </div>
        <div className="glass-card">
          <p className="text-sm text-muted-foreground mb-1">Next Payment</p>
          <p className="text-xl font-bold text-accent-400">Oct 23, 2025</p>
        </div>
        <div className="glass-card">
          <p className="text-sm text-muted-foreground mb-1">Total Recipients</p>
          <p className="text-3xl font-bold text-accent-400">
            {mockSchedules.reduce((sum, s) => sum + s.employees, 0)}
          </p>
        </div>
      </div>

      {/* Schedules List */}
      <div className="glass-card">
        <h3 className="font-semibold mb-4">All Schedules</h3>
        <div className="space-y-4">
          {mockSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="p-5 bg-dark-card border border-dark-border rounded-lg hover:border-accent-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-lg mb-1">{schedule.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {schedule.frequency}
                    </span>
                    <span>{schedule.employees} employees</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {schedule.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-dark-bg/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Next Run</p>
                  <p className="font-semibold text-accent-400">{schedule.nextRun}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                  <p className="font-semibold text-accent-400">${schedule.amount}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 px-4 py-2 bg-accent-600/20 hover:bg-accent-600/30 text-accent-400 rounded-lg text-sm font-medium transition-all">
                  Edit Schedule
                </button>
                <button className="px-4 py-2 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-lg text-sm font-medium transition-all">
                  Run Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="glass-card bg-accent-500/5 border-accent-500/20">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-accent-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-accent-400 mb-1">
              Automated Scheduling
            </h3>
            <p className="text-sm text-muted-foreground">
              Schedules are processed automatically using MagicBlock ephemeral rollups for efficient batch payments
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
