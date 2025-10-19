'use client';

import { UserCog, Plus, Mail, Wallet } from 'lucide-react';

const mockEmployees = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@company.com',
    wallet: '7xJ8...RsTu',
    salary: '5000',
    status: 'active',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@company.com',
    wallet: '9aB2...XyZ1',
    salary: '6000',
    status: 'active',
  },
];

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
            <UserCog className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Employees</h1>
            <p className="text-muted-foreground">
              Manage your payroll recipients
            </p>
          </div>
        </div>

        <button className="px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card">
          <p className="text-sm text-muted-foreground mb-1">Total Employees</p>
          <p className="text-3xl font-bold text-accent-400">{mockEmployees.length}</p>
        </div>
        <div className="glass-card">
          <p className="text-sm text-muted-foreground mb-1">Monthly Payroll</p>
          <p className="text-3xl font-bold text-accent-400">
            {mockEmployees.reduce((sum, emp) => sum + parseFloat(emp.salary), 0).toLocaleString()} USD
          </p>
        </div>
        <div className="glass-card">
          <p className="text-sm text-muted-foreground mb-1">Active</p>
          <p className="text-3xl font-bold text-green-400">
            {mockEmployees.filter((e) => e.status === 'active').length}
          </p>
        </div>
      </div>

      {/* Employees List */}
      <div className="glass-card">
        <h3 className="font-semibold mb-4">All Employees</h3>
        <div className="space-y-3">
          {mockEmployees.map((employee) => (
            <div
              key={employee.id}
              className="p-4 bg-dark-card border border-dark-border rounded-lg hover:border-accent-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white font-semibold">
                    {employee.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="font-semibold">{employee.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {employee.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        {employee.wallet}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-accent-400">
                    ${employee.salary}
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs mt-1">
                    {employee.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
