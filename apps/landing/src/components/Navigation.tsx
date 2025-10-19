'use client';

import Link from 'next/link';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-ninja-purple" />
            <span className="text-2xl font-bold text-gradient">NinjaPay</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-ninja-purple transition-colors">
              Features
            </Link>
            <Link href="#developers" className="text-gray-600 hover:text-ninja-purple transition-colors">
              Developers
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-ninja-purple transition-colors">
              Pricing
            </Link>
            <Link href="https://docs.ninjapay.xyz" className="text-gray-600 hover:text-ninja-purple transition-colors">
              Docs
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-ninja-purple transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-ninja-gradient text-white rounded-lg hover:shadow-lg transition-all"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 pt-2 pb-4 space-y-3">
            <Link
              href="#features"
              className="block py-2 text-gray-600 hover:text-ninja-purple"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#developers"
              className="block py-2 text-gray-600 hover:text-ninja-purple"
              onClick={() => setMobileMenuOpen(false)}
            >
              Developers
            </Link>
            <Link
              href="#pricing"
              className="block py-2 text-gray-600 hover:text-ninja-purple"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="https://docs.ninjapay.xyz"
              className="block py-2 text-gray-600 hover:text-ninja-purple"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </Link>
            <div className="pt-4 space-y-2">
              <Link
                href="/dashboard"
                className="block w-full px-4 py-2 text-center border border-ninja-purple text-ninja-purple rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="block w-full px-4 py-2 text-center bg-ninja-gradient text-white rounded-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
