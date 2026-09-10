import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { SiteProvider } from '@/components/site/SiteProvider';
import { Nav } from '@/components/site/Nav';
import { Footer } from '@/components/site/Footer';
import * as repo from '@/lib/db/repo';

const display = localFont({
  src: [
    { path: '../node_modules/@fontsource/fraunces/files/fraunces-latin-400-normal.woff2', weight: '400' },
    { path: '../node_modules/@fontsource/fraunces/files/fraunces-latin-500-normal.woff2', weight: '500' },
    { path: '../node_modules/@fontsource/fraunces/files/fraunces-latin-600-normal.woff2', weight: '600' },
    { path: '../node_modules/@fontsource/fraunces/files/fraunces-latin-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-display',
  display: 'swap',
});

const body = localFont({
  src: [
    { path: '../node_modules/@fontsource/karla/files/karla-latin-400-normal.woff2', weight: '400' },
    { path: '../node_modules/@fontsource/karla/files/karla-latin-500-normal.woff2', weight: '500' },
    { path: '../node_modules/@fontsource/karla/files/karla-latin-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-body',
  display: 'swap',
});

const hand = localFont({
  src: [
    { path: '../node_modules/@fontsource/caveat/files/caveat-latin-400-normal.woff2', weight: '400' },
    { path: '../node_modules/@fontsource/caveat/files/caveat-latin-600-normal.woff2', weight: '600' },
    { path: '../node_modules/@fontsource/caveat/files/caveat-latin-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-hand',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'TherecipeSeeker — a kitchen that feels like home', template: '%s — TherecipeSeeker' },
  description:
    'Real recipes with a why before the how, a pantry that cooks with what you already have, and a circle of women who leave the world at the door.',
  openGraph: {
    title: 'TherecipeSeeker — a kitchen that feels like home',
    description: 'Warm recipes, kind notes, a safe circle. 11k friends on Pinterest.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf3e7' },
    { media: '(prefers-color-scheme: dark)', color: '#201511' },
  ],
};

async function getSiteMeta() {
  try {
    const s = await repo.getSettings();
    return { title: s.hero_title || 'Tonight, let’s make something kind to yourself.', name: s.site_name || 'TherecipeSeeker' };
  } catch {
    return { title: 'Tonight, let’s make something kind to yourself.', name: 'TherecipeSeeker' };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteMeta();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} ${hand.variable} font-body antialiased`}>
        <SiteProvider siteName={site.name}>
          <Nav />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </SiteProvider>
      </body>
    </html>
  );
}
