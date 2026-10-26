import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export const metadata: Metadata = {
  title: 'Creator Labs Support | Workshop & Webinar Access Portal',
  description:
    'Instant self-service support portal for Creator Labs attendees. Retrieve your WhatsApp Community link, Zoom webinar access, and workshop schedule.',
  keywords: [
    'Creator Labs',
    'workshop access',
    'webinar zoom link',
    'whatsapp community link',
    'creator support',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Script
          src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
