import Link from 'next/link';
import { Shield, Github, Twitter, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-ninja-purple" />
              <span className="text-2xl font-bold text-white">NinjaPay</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Confidential payments infrastructure for the internet. Built on Solana.
            </p>
            <div className="flex space-x-4">
              <a href="https://github.com/ninjapay" className="hover:text-ninja-purple transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/ninjapay" className="hover:text-ninja-purple transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="mailto:hello@ninjapay.xyz" className="hover:text-ninja-purple transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold text-white mb-4">Products</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-ninja-purple transition-colors">Payments</Link></li>
              <li><Link href="#" className="hover:text-ninja-purple transition-colors">Payroll</Link></li>
              <li><Link href="#" className="hover:text-ninja-purple transition-colors">Payment Links</Link></li>
              <li><Link href="#" className="hover:text-ninja-purple transition-colors">APIs</Link></li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h4 className="font-semibold text-white mb-4">Developers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="https://docs.ninjapay.xyz" className="hover:text-ninja-purple transition-colors">Documentation</Link></li>
              <li><Link href="https://docs.ninjapay.xyz/api" className="hover:text-ninja-purple transition-colors">API Reference</Link></li>
              <li><Link href="https://docs.ninjapay.xyz/sdks" className="hover:text-ninja-purple transition-colors">SDKs</Link></li>
              <li><Link href="https://github.com/ninjapay" className="hover:text-ninja-purple transition-colors">GitHub</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-ninja-purple transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-ninja-purple transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-ninja-purple transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-ninja-purple transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="text-gray-400 mb-4 md:mb-0">
            © 2025 NinjaPay. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="#" className="text-gray-400 hover:text-ninja-purple transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-gray-400 hover:text-ninja-purple transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-gray-400 hover:text-ninja-purple transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
