import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Youcast — Creator-Owned Media Platform',
    template: '%s | Youcast',
  },
  description:
    'Stream, publish, and grow on the creator-owned media platform. Video, audio, live streaming, distribution, and community — built for independent creators.',
  keywords: [
    'youcast',
    'streaming',
    'creator platform',
    'live streaming',
    'video hosting',
    'podcast',
    'media network',
  ],
  openGraph: {
    title: 'Youcast — Creator-Owned Media Platform',
    description: 'Stream, publish, and grow on the creator-owned media platform.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Youcast',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Youcast — Creator-Owned Media Platform',
    description: 'Stream, publish, and grow on the creator-owned media platform.',
  },
  robots: { index: true, follow: true },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-950 text-surface-200 antialiased">
        {children}
      </body>
    </html>
  );
}
