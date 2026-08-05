import type { Metadata } from "next";
import Link from "next/link";
import { GeometricShapes } from "@/components/brand/GeometricShapes";
import { ContactForm } from "@/components/contact/ContactForm";
import { OrriiiLogo } from "@/components/site/OrriiiLogo";
import { ScrollAwareHeader } from "@/components/site/ScrollAwareHeader";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Contact Orriii",
  description:
    "Contact the Orriii team about partner events, collaborations, product questions and mobile orienteering.",
  path: "/contact",
});

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ interest?: string }>;
}) {
  const interest = (await searchParams).interest;
  const isEarlyAccess = interest === "app-store";
  const isPartner = interest === "partner";

  return (
    <>
      <main className="contact-page">
        <ScrollAwareHeader
          ariaLabel="Contact page navigation"
          navClassName="contact-header__nav"
          navItems={[
            { label: "For explorers", href: "/#explorers" },
          ]}
          className="contact-header"
        />
        <GeometricShapes className="contact-page__shapes" />

        <section className="contact-layout">
          <div className="contact-intro">
            <p className="contact-eyebrow">{isEarlyAccess ? "EARLY ACCESS / ORRIII" : isPartner ? "PARTNER WITH ORRIII" : "CONTACT / ORRIII"}</p>
            <h1>{isEarlyAccess ? "Be first outside with Orriii." : isPartner ? "Turn your place into the next adventure." : "Let's plan something worth going outside for."}</h1>
            <p className="contact-intro__body">
              {isEarlyAccess
                ? "Join the launch list for product updates and early access opportunities. Tell us where you would take Orriii first."
                : isPartner
                  ? "Tell us about your resort, park, campus, club or event. We will help shape it into a playable Orriii route."
                  : "Ask about Orriii, tell us about an event your organisation runs, or start a product partnership with the Renowa Labs team."}
            </p>

            <dl className="contact-facts">
              <div>
                <dt>CONTACT</dt>
                <dd>Use the secure form on this page</dd>
              </div>
              <div>
                <dt>BEST FOR</dt>
                <dd>{isEarlyAccess ? "Explorers, runners and curious early adopters" : "Partner events, clubs, schools and collaborations"}</dd>
              </div>
              <div>
                <dt>PRODUCT BY</dt>
                <dd>
                  <a
                    href="https://www.renowa-labs.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Renowa Labs ↗
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="contact-form-shell">
            <div className="contact-form-shell__topline">
              <span>NEW MESSAGE</span>
              <span>SECURED BY CLOUDFLARE</span>
            </div>
            <ContactForm initialInterest={isEarlyAccess ? "app-store" : isPartner ? "partner" : undefined} />
          </div>
        </section>
      </main>

      <footer className="orriii-footer orriii-footer--contact">
        <OrriiiLogo />
        <p>
          Orriii is a mobile orienteering product by{" "}
          <a
            href="https://www.renowa-labs.com"
            target="_blank"
            rel="noreferrer"
          >
            Renowa Labs
          </a>
          .
        </p>
        <div>
          <Link href="/">Orriii home</Link>
          <a href="/privacy">Privacy</a>
          <a
            href="https://www.renowa-labs.com"
            target="_blank"
            rel="noreferrer"
          >
            Renowa Labs
          </a>
          <span>© {new Date().getFullYear()} ORRIII</span>
        </div>
      </footer>
    </>
  );
}
