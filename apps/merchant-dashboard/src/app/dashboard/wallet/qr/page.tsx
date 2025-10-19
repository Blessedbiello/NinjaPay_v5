'use client';

import { QrCode, Camera, Scan } from 'lucide-react';

export default function QRScannerPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center">
          <QrCode className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">QR Scanner</h1>
          <p className="text-muted-foreground">
            Scan QR codes to send payments quickly
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner */}
        <div className="glass-card">
          <div className="aspect-square bg-dark-card border-2 border-dashed border-dark-border rounded-xl flex flex-col items-center justify-center">
            <Camera className="w-24 h-24 text-muted-foreground mb-6" />
            <p className="text-muted-foreground mb-4">Camera access required</p>
            <button className="px-6 py-3 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center gap-2">
              <Scan className="w-4 h-4" />
              Enable Camera
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <div className="glass-card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Scan className="w-5 h-5 text-secondary-400" />
              How to Use
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary-500/20 flex items-center justify-center flex-shrink-0 text-secondary-400 font-semibold">
                  1
                </div>
                <p>Enable camera access to start scanning</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary-500/20 flex items-center justify-center flex-shrink-0 text-secondary-400 font-semibold">
                  2
                </div>
                <p>Point your camera at a NinjaPay QR code</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary-500/20 flex items-center justify-center flex-shrink-0 text-secondary-400 font-semibold">
                  3
                </div>
                <p>Review payment details and confirm</p>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="font-semibold mb-3">Supported QR Codes</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary-400"></div>
                Solana wallet addresses
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary-400"></div>
                NinjaPay payment links
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary-400"></div>
                Solana Pay requests
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
