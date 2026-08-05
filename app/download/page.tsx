import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { OrriiiMascot } from "@/components/brand/OrriiiMascot";
import { DownloadRouteGraphic } from "@/components/brand/DownloadRouteGraphic";
import { AppStoreButton, GooglePlayComingSoon } from "@/components/site/AppStoreButton";
import { OrriiiLogo } from "@/components/site/OrriiiLogo";
import { ScrollAwareHeader } from "@/components/site/ScrollAwareHeader";
import { APP_STORE_URL } from "@/lib/app-store";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Download the Orriii orienteering app",
  description: "Bring your next real-world adventure into your pocket with Orriii.",
  path: "/download",
});

export default function DownloadPage() {
  const appIsAvailable = Boolean(APP_STORE_URL);

  return (
    <div className="download-page">
      <ScrollAwareHeader
        ariaLabel="Download page navigation"
        navItems={[{ label: "Explore Orriii", href: "/" }]}
        className="site-header download-header"
      />

      <main>
        <section className="download-hero" aria-labelledby="download-title">
          <div className="download-hero__copy">
            <div className="download-hero__eyebrow-row">
              <span className="section-eyebrow">ORRIII IN YOUR POCKET</span>
              <span className="download-hero__edition">FIELD GUIDE / 01</span>
            </div>
            <h1 id="download-title">
              Turn outside into a game.
            </h1>
            <p>
              Follow a real route, find every checkpoint and collect the day as you move.
            </p>
            <div className="download-hero__actions">
              <AppStoreButton className="primary-action" />
              <GooglePlayComingSoon />
            </div>
            <p className="download-hero__note">
              {appIsAvailable
                ? "Available on iPhone · Android is coming soon"
                : "Join the early-access list · Android is coming soon"}
            </p>
          </div>

          <div className="download-hero__visual" aria-label="Preview of the Orriii mobile app">
            <div className="download-hero__visual-meta">
              <span>40.5792° N / 49.9381° E</span>
              <span>ROUTE ACTIVE</span>
            </div>
            <DownloadRouteGraphic />
            <div className="download-hero__phone-stage">
              <span className="download-hero__sticker">RUN / FIND / COLLECT</span>
              <Image
                className="download-hero__phone"
                src="/assets/orriii-iphone-cutout.png"
                alt="The Orriii app showing route progress and checkpoints on a phone"
                width={726}
                height={1563}
                priority
              />
            </div>
            <div className="download-hero__mascot">
              <OrriiiMascot pose="pointing" title="Orriii mascot pointing to the app" />
            </div>
          </div>
        </section>
      </main>

      <footer className="orriii-footer download-footer">
        <Link href="/" aria-label="Orriii home">
          <OrriiiLogo />
        </Link>
        <p>
          Orriii is a mobile orienteering product by{" "}
          <a href="https://www.renowa-labs.com" target="_blank" rel="noreferrer">
            Renowa Labs
          </a>
          .
        </p>
        <div>
          <Link href="/">Explore</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <span>© {new Date().getFullYear()} ORRIII</span>
        </div>
      </footer>
    </div>
  );
}
