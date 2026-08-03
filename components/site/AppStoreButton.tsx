import { APP_STORE_FALLBACK, APP_STORE_URL } from "@/lib/app-store";

function AppleIcon() {
  return (
    <svg aria-hidden="true" className="apple-icon" viewBox="0 0 24 24">
      <path d="M16.9 12.7c0-2.1 1.7-3.1 1.8-3.2-1-.1-2.2-1.1-3.5-1.1-1.4 0-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.6 0-3.1 1-3.9 2.5-1.7 3-.4 7.5 1.2 9.9.8 1.2 1.7 2.5 2.9 2.4 1.2 0 1.6-.8 3-.8 1.4 0 1.8.8 3 .8 1.3 0 2.1-1.2 2.8-2.4.9-1.4 1.3-2.8 1.3-2.9-.1 0-2.2-.9-2.2-3.2ZM14.6 6.9c.6-.8 1-1.9.9-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2.1-.5 2.8-1.3Z" />
    </svg>
  );
}

export function AppStoreButton({ className = "" }: { className?: string }) {
  const available = Boolean(APP_STORE_URL);
  const href = APP_STORE_URL ?? APP_STORE_FALLBACK;

  return (
    <a
      className={`app-store-button ${className}`.trim()}
      href={href}
      target={available ? "_blank" : undefined}
      rel={available ? "noreferrer" : undefined}
      aria-label={available ? "Download Orriii on the App Store" : "App Store — Coming soon"}
    >
      <AppleIcon />
      <span>{available ? "Download on App Store" : "App Store — Coming soon"}</span>
      <span className="button-arrow" aria-hidden="true">↗</span>
    </a>
  );
}

export function GooglePlayComingSoon() {
  return (
    <span className="store-coming-soon">
      <svg aria-hidden="true" className="android-icon" viewBox="0 0 24 24">
        <path d="M7.2 8.5h9.6v8.2c0 .8-.6 1.4-1.4 1.4H8.6c-.8 0-1.4-.6-1.4-1.4V8.5Zm1.4-2.1L7.5 4.7m9 1.7 1.1-1.7M10 4.9l.9 1.5h2.2l.9-1.5M5 9.1v5.8m14-5.8v5.8M9.5 19.1v2.2m5-2.2v2.2" />
        <circle cx="10" cy="10.7" r=".55" />
        <circle cx="14" cy="10.7" r=".55" />
      </svg>
      Google Play — Coming soon
    </span>
  );
}
