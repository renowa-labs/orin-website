import type { Metadata } from "next";
import { headers } from "next/headers";
import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { ToastProvider } from "@/components/site/ToastProvider";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const incomingHeaders = await headers();
  const host =
    incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host");
  const protocol =
    incomingHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const origin = host ? `${protocol}://${host}` : undefined;

  return {
    title: "Orriii — Explore partner-created outdoor events",
    description:
      "Discover partner-led orienteering events, navigate to real controls in the Orriii app, or talk to us about publishing with Orriii.",
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
      apple: "/assets/orriii-brand.png",
    },
    openGraph: {
      title: "Orriii — Explore partner-created outdoor events",
      description:
        "Discover an event on the web, then navigate real control points in the Orriii mobile app.",
      type: "website",
      images: origin
        ? [
            {
              url: `${origin}/og.png`,
              width: 1200,
              height: 630,
              alt: "An orange-and-white orienteering control on a Baku coastline map",
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "Orriii — Explore partner-created outdoor events",
      description:
        "Discover a partner-led event on the web, then navigate every real control in the Orriii mobile app.",
      images: origin ? [`${origin}/og.png`] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${plexMono.variable}`}>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
