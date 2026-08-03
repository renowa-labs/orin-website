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
    title: "Orriii — Turn the map into a game",
    description:
      "Orriii turns parks, resorts and neighbourhoods into real-world adventures. Run, find, collect and repeat.",
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
      apple: "/assets/orriii-brand.png",
    },
    openGraph: {
      title: "Orriii — Turn the map into a game",
      description:
        "Follow a real route, find every checkpoint and see where the day takes you.",
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
      title: "Orriii — Turn the map into a game",
      description:
        "Follow a real route, find every checkpoint and see where the day takes you.",
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
