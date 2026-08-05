import type { Metadata } from "next";
import Link from "next/link";
import { OrriiiLogo } from "@/components/site/OrriiiLogo";
import { ScrollAwareHeader } from "@/components/site/ScrollAwareHeader";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "Learn how Orriii and Renowa Labs collect, use, share, retain, and protect personal information.",
  path: "/privacy",
});

type PolicySection = {
  title: string;
  intro?: string;
  paragraphs?: string[];
  bullets?: string[];
};

const sections: PolicySection[] = [
  {
    title: "Who we are and what this covers",
    paragraphs: [
      "Orriii is an orienteering product provided by Renowa Labs. This policy covers the Orriii mobile app and the website at orriii.renowa-labs.com.",
      "We collect and use personal information only when it is reasonably necessary to provide, secure, and improve the service described here.",
    ],
  },
  {
    title: "Information we collect",
    intro: "Depending on how you use Orriii, we collect:",
    bullets: [
      "Account information: your name, email address, age, sex, and avatar or profile details you provide when registering or editing your profile.",
      "Authentication information: your password is used to authenticate your account; the app retains session tokens on your device so that you can stay signed in.",
      "Event and activity information: events you join, control-point check-ins, race times, results, rankings, XP, and race history.",
      "Location information: your device’s precise location when you choose to grant location permission and use a location-based map or race feature.",
      "Contact information and messages that you submit through our website contact form or send to us by email.",
    ],
  },
  {
    title: "How we use information",
    bullets: [
      "Create and secure your account, authenticate you, and provide account support.",
      "Display maps, verify your position at a race start or control point, and run the event features you request.",
      "Create event results, leaderboards, route-related activity records, and progress summaries.",
      "Respond to your questions, investigate misuse or technical problems, and protect the service.",
      "Comply with applicable law and enforce our rights and obligations.",
    ],
  },
  {
    title: "Location data",
    paragraphs: [
      "Location permission is optional. Orriii asks for it only when you use a feature that needs it, such as centering the map, verifying a race start, or detecting a control point. You can decline permission or change it later in your device settings; location-dependent features will then be unavailable.",
      "Orriii does not request background location permission. We do not sell precise location information or use it for advertising or cross-app tracking.",
    ],
  },
  {
    title: "When information is shared",
    bullets: [
      "Event organisers and other participants may receive the participation, check-in, result, ranking, and profile information needed to operate events and display leaderboards.",
      "Service providers may process information for us only to provide their services, including hosting and API infrastructure, Mapbox map services, Expo update services, email delivery, and the website’s security and contact-form services.",
      "We may disclose information where required by law, to protect people or the service, or in connection with a corporate transaction. We do not sell personal information or share it with advertisers or data brokers.",
    ],
  },
  {
    title: "Your choices and account deletion",
    bullets: [
      "Use your device settings to allow or revoke location and notification permissions.",
      "Update your name and avatar in the app. You may also contact us to request access to, correction of, or deletion of personal information.",
      "Delete your account in the app: Settings → Privacy → Delete account. This initiates deletion of the account and associated personal data held by our service, subject to the limited retention described below.",
    ],
  },
  {
    title: "Retention and security",
    paragraphs: [
      "We retain account and event information for as long as needed to provide Orriii and maintain event records. After deletion, we remove or de-identify personal information unless we need a limited record for security, fraud prevention, dispute resolution, or a legal obligation.",
      "We use reasonable administrative, technical, and organizational safeguards designed to protect information. No internet or storage system is completely secure, so please use a unique password and contact us promptly if you suspect unauthorized access.",
    ],
  },
  {
    title: "Children's privacy",
    paragraphs: [
      "Orriii is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided personal information, contact us and we will take appropriate steps to review and delete it.",
    ],
  },
  {
    title: "Changes to this policy",
    paragraphs: [
      "We will post an updated policy at orriii.renowa-labs.com/privacy and update the date above. For material changes, we will provide additional notice in the app or by email when appropriate before the change takes effect.",
    ],
  },
];

function PolicySection({ section }: { section: PolicySection }) {
  return (
    <section className="privacy-section" aria-label={section.title}>
      <h2>{section.title}</h2>
      {section.intro ? <p>{section.intro}</p> : null}
      {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {section.bullets ? (
        <ul>
          {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
      ) : null}
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <main className="privacy-page">
        <ScrollAwareHeader
          ariaLabel="Privacy policy navigation"
          navClassName="contact-header__nav"
          navItems={[
            { label: "For explorers", href: "/#explorers" },
            { label: "Contact", href: "/contact" },
          ]}
          className="contact-header"
        />

        <article className="privacy-layout">
          <header className="privacy-intro">
            <p className="privacy-eyebrow">PRIVACY / ORRIII</p>
            <h1>Your data, clearly explained.</h1>
            <p>
              Orriii uses account, event, and location information only to operate and protect orienteering experiences. This policy explains the information involved, why it is used, and your controls.
            </p>
            <p className="privacy-updated">Last updated August 5, 2026</p>
          </header>

          <div className="privacy-policy">
            {sections.map((section) => <PolicySection key={section.title} section={section} />)}

            <section className="privacy-contact" aria-labelledby="privacy-contact-title">
              <p className="privacy-eyebrow">CONTACT</p>
              <h2 id="privacy-contact-title">Questions about your data?</h2>
              <p>
                Email <a href="mailto:info@renowa-labs.com">info@renowa-labs.com</a> or use our <a href="/contact">contact form</a>. Please do not include passwords, payment information, or other sensitive details in an email.
              </p>
            </section>
          </div>
        </article>
      </main>

      <footer className="orriii-footer">
        <OrriiiLogo />
        <p>Orriii is a mobile orienteering product by <a href="https://www.renowa-labs.com" target="_blank" rel="noreferrer">Renowa Labs</a>.</p>
        <div>
          <Link href="/">Orriii home</Link>
          <Link href="/contact">Contact</Link>
          <span>© {new Date().getFullYear()} ORRIII</span>
        </div>
      </footer>
    </>
  );
}
