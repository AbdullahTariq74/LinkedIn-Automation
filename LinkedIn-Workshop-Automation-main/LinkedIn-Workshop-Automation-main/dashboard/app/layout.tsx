import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Workshop Campaign · Michael Ohlmer',
  description: "LinkedIn outreach dashboard — Michael Ohlmer's June 30 workshop",
  icons: {
    icon: '/mo-favicon.png',
    shortcut: '/mo-favicon.png',
    apple: '/mo-favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <nav
            className="sticky top-0 z-10 backdrop-blur-md"
            style={{ background: 'var(--bg-nav)', borderBottom: '1px solid var(--border-nav)' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center px-3 py-1.5 rounded-lg"
                  style={{ background: '#0B1120' }}
                >
                  <Image
                    src="/mo-logo-white.png"
                    alt="Michael Ohlmer"
                    width={88}
                    height={25}
                    priority
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <div
                  className="h-4 w-px hidden sm:block"
                  style={{ background: 'var(--border)' }}
                />
                <span className="text-xs hidden sm:block" style={{ color: 'var(--text-subtle)' }}>
                  Workshop Campaign · June 30, 2026
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Dashboard
                </Link>
                <Link
                  href="/leads"
                  className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Leads
                </Link>
                <Link
                  href="/import"
                  className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Import
                </Link>
                <Link
                  href="/posts"
                  className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Posts
                </Link>
                <div className="ml-2">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
