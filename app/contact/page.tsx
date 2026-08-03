/* eslint-disable @next/next/no-html-link-for-pages -- vinext's development optimizer can load a duplicate React instance through next/link */
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { OrriiiLogo } from "@/components/site/OrriiiLogo";

export const metadata: Metadata = {
  title: "Contact Orriii — Renowa Labs",
  description:
    "Contact the Orriii team about partner events, collaborations, product questions and mobile orienteering.",
};

export default function ContactPage() {
  return (
    <>
      <main className="contact-page">
        <header className="contact-header">
          <a href="/" aria-label="Orriii home">
            <OrriiiLogo />
          </a>
          <nav aria-label="Contact page navigation">
            <a href="/#participants">For participants</a>
            <a href="/#organizers">For partner organisations</a>
            <a className="header-action" href="/">
              Back to Orriii <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </header>

        <section className="contact-layout">
          <div className="contact-intro">
            <p className="contact-eyebrow">CONTACT / ORRIII</p>
            <h1>Let&apos;s plan something worth going outside for.</h1>
            <p className="contact-intro__body">
              Ask about Orriii, tell us about an event your organisation runs, or
              start a product partnership with the Renowa Labs team.
            </p>

            <dl className="contact-facts">
              <div>
                <dt>CONTACT</dt>
                <dd>Use the secure form on this page</dd>
              </div>
              <div>
                <dt>BEST FOR</dt>
                <dd>Partner events, clubs, schools and collaborations</dd>
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
            <ContactForm />
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
          <a href="/">Orriii home</a>
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
