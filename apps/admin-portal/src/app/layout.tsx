import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const ibmSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm',
});

export const metadata: Metadata = {
  title: 'NinjaPay Admin Portal',
  description: 'Internal control center for operations, risk and compliance teams.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmSans.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

