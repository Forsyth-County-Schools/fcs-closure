import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { generateStructuredData, generateBreadcrumbStructuredData } from "@/lib/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FCS School Status Checker - Real-time Forsyth County Schools Weather Monitoring",
  description: "Get instant updates on Forsyth County Schools weather closures and delays. Real-time monitoring for Monday, February 2nd and beyond. Stay informed with automated alerts.",
  keywords: "Forsyth County Schools, FCS, school closures, weather delays, school status, Georgia schools, weather monitoring, schoolcancelled.today",
  authors: [{ name: "FCS Status Monitor" }],
  creator: "FCS Status Monitor",
  publisher: "FCS Status Monitor",
  metadataBase: new URL('https://schoolcancelled.today'),
  openGraph: {
    url: 'https://schoolcancelled.today',
    title: "FCS School Status Checker - Real-time Weather Monitoring",
    description: "Get instant updates on Forsyth County Schools weather closures and delays. Real-time monitoring with automated alerts.",
    siteName: "FCS Status Monitor",
    images: [
      {
        url: 'https://gray-whns-prod.gtv-cdn.com/resizer/v2/MUX6K43VUJG75OOLXOZ7BADLOE.png?auth=4217767f9fe03582cc6971c89614aa572c3811cd15ed67345139411cb62bf124&width=1200&height=600&smart=true',
        width: 1200,
        height: 600,
        alt: 'Forsyth County Schools Weather Status Monitor',
      },
      {
        url: '/logo.webp',
        width: 400,
        height: 400,
        alt: 'Forsyth County Schools Logo',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "FCS School Status Checker - Real-time Weather Monitoring",
    description: "Get instant updates on Forsyth County Schools weather closures and delays. Real-time monitoring with automated alerts.",
    images: ['https://gray-whns-prod.gtv-cdn.com/resizer/v2/MUX6K43VUJG75OOLXOZ7BADLOE.png?auth=4217767f9fe03582cc6971c89614aa572c3811cd15ed67345139411cb62bf124&width=1200&height=600&smart=true'],
    creator: '@FCSSchools',
    site: '@schoolcancelled',
  },
  icons: {
    icon: '/logo.webp',
    shortcut: '/logo.webp',
    apple: '/logo.webp',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FCS Status',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self' https://schoolcancelled.today; script-src 'self' https://schoolcancelled.today https://www.googletagmanager.com 'unsafe-eval' 'unsafe-inline'; style-src 'self' https://schoolcancelled.today 'unsafe-inline'; connect-src 'self' https://schoolcancelled.today https://www.google-analytics.com https://analytics.google.com; img-src 'self' https://schoolcancelled.today data: https://www.google-analytics.com; font-src 'self' https://schoolcancelled.today;" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-NMD57F7NKF"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-NMD57F7NKF');
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateBreadcrumbStructuredData()),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
