'use client';

import { useState } from 'react';
import { Users, Upload, Zap, CheckCircle2 } from 'lucide-react';

export default function BatchPayrollPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Batch Payroll</h1>
          <p className="text-muted-foreground">
            Process multiple payments with MagicBlock ephemeral rollups
          </p>
        </div>
      </div>

      {/* MagicBlock Info Banner */}
      <div className="glass-card bg-accent-500/5 border-accent-500/20">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-accent-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-accent-400 mb-1">
              Powered by MagicBlock Ephemeral Rollups
            </h3>
            <p className="text-sm text-muted-foreground">
              Process thousands of payments with ultra-low fees and instant settlement
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card">
            <h3 className="font-semibold mb-4">Upload Payroll CSV</h3>

            <div className="border-2 border-dashed border-dark-border rounded-xl p-12 text-center hover:border-accent-500/50 transition-all">
              <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="csv-upload"
                className="inline-block px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-medium transition-all btn-glow cursor-pointer"
              >
                Choose File
              </label>
              {csvFile && (
                <p className="mt-4 text-sm text-accent-400">
                  Selected: {csvFile.name}
                </p>
              )}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3">CSV Format</h4>
              <div className="bg-dark-card border border-dark-border rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <div className="text-muted-foreground">
                  wallet_address,amount,reference
                  <br />
                  7xJ8...RsTu,1000.50,Salary - John Doe
                  <br />
                  9aB2...XyZ1,1500.00,Salary - Jane Smith
                </div>
              </div>
            </div>
          </div>

          {csvFile && (
            <div className="glass-card">
              <h3 className="font-semibold mb-4">Preview</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-dark-card rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Recipients</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-card rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">0 SOL</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-card rounded-lg">
                  <span className="text-sm text-muted-foreground">Estimated Fee</span>
                  <span className="font-semibold text-accent-400">~0.01 SOL</span>
                </div>
              </div>

              <button className="w-full mt-6 px-6 py-4 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                Process Payroll
              </button>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <div className="glass-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent-400" />
              Benefits
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400 mt-2"></div>
                <p>Process up to 10,000 payments in a single batch</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400 mt-2"></div>
                <p>Ultra-low fees with MagicBlock rollups</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400 mt-2"></div>
                <p>Instant settlement on Solana</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400 mt-2"></div>
                <p>All amounts encrypted with Arcium MPC</p>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="font-semibold mb-3">Recent Batches</h3>
            <p className="text-sm text-muted-foreground">
              No batch payments processed yet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
