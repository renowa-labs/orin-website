import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Nunito } from "next/font/google";
import { ToastProvider } from "@/components/site/ToastProvider";
import { SITE_URL } from "@/lib/site";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";
import "./race.css";
import "./not-found.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const logoFont = Nunito({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Orriii — Turn the map into a game",
    template: "%s | Orriii",
  },
  description:
    "Orriii is a mobile orienteering app that turns parks, resorts and neighbourhoods into real-world adventures.",
  applicationName: "Orriii",
  creator: "Renowa Labs",
  publisher: "Renowa Labs",
  category: "Sports & recreation",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/brand/orin-favicon-180.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Orriii — Turn the map into a game",
    description:
      "Follow real routes, find checkpoints and turn every outdoor place into an adventure.",
    url: "/",
    siteName: "Orriii",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "An orange-and-white orienteering control on a Baku coastline map",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Orriii — Turn the map into a game",
    description:
      "Follow real routes, find checkpoints and turn every outdoor place into an adventure.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Renowa Labs",
        url: "https://www.renowa-labs.com",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Orriii",
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: "Orriii",
        applicationCategory: "GameApplication",
        operatingSystem: "iOS",
        description:
          "A mobile orienteering app for following real routes, finding checkpoints and exploring outdoor places.",
        url: SITE_URL,
        image: `${SITE_URL}/brand/orin-app-icon-512.png`,
        provider: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${plexMono.variable} ${logoFont.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
