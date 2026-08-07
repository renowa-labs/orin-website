import Link from "next/link";
import { OrriiiLogo } from "@/components/site/OrriiiLogo";

function TrailBackdrop() {
  return (
    <svg
      className="not-found-page__backdrop"
      viewBox="0 0 1440 620"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g className="not-found-page__contours">
        <path d="M-80 488c104-62 194-78 294-38 77 31 112 94 224 74 95-17 121-86 242-98 146-14 184 76 305 51 102-21 145-104 274-114 91-7 165 24 261 83" />
        <path d="M-72 528c116-68 218-78 318-28 84 42 119 107 232 85 97-19 120-93 247-108 150-18 191 75 319 48 107-23 150-104 280-116 94-9 171 20 261 72" />
        <path d="M-46 570c128-62 230-63 329-8 84 47 127 108 242 83 96-21 121-89 248-104 155-18 202 73 333 47 113-23 157-99 287-109 92-7 167 18 241 57" />
        <path d="M160 442c42-39 104-44 146-11 38 30 34 78-10 105-46 28-114 21-145-17-28-35-24-47 9-77Z" />
        <path d="M1044 424c53-44 123-46 163-8 37 36 23 86-31 111-57 27-129 12-153-31-20-36-9-47 21-72Z" />
      </g>
      <path
        className="not-found-page__route"
        d="M-40 576c135-15 186-124 306-104 105 18 111 110 233 108 132-2 176-114 318-92 139 21 170 137 308 91 84-28 128-92 222-80 60 8 95 43 133 65"
      />
      <g className="not-found-page__crosses">
        <path d="m205 474 13 13m0-13-13 13" />
        <path d="m1018 508 13 13m0-13-13 13" />
      </g>
    </svg>
  );
}

function ControlFlag() {
  return (
    <svg
      className="not-found-page__flag"
      viewBox="0 0 180 150"
      role="img"
      aria-label="Orienteering checkpoint flag"
    >
      <ellipse cx="90" cy="135" rx="58" ry="7" className="not-found-page__flag-shadow" />
      <path d="M89 30v94" className="not-found-page__flag-pole" />
      <path d="M63 46h52v52H63z" className="not-found-page__flag-box" />
      <path d="M63 46h52L89 72 63 46Z" className="not-found-page__flag-white" />
      <path d="m115 46-26 26 26 26V46Z" className="not-found-page__flag-orange" />
      <path d="m63 98 26-26 26 26H63Z" className="not-found-page__flag-orange" />
      <path d="M89 72 63 46v52l26-26Z" className="not-found-page__flag-white" />
      <path d="M78 24h24" className="not-found-page__flag-cap" />
      <path d="M52 127c9-13 23-13 32 0m18 2c8-10 19-10 27 0" className="not-found-page__flag-ground" />
      <path d="m48 126-8-8m10 8 1-12m80 14 9-8m-11 9 1-13" className="not-found-page__flag-grass" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <main className="not-found-page">
      <TrailBackdrop />

      <header className="not-found-page__header">
        <Link className="not-found-page__brand" href="/" aria-label="Orriii home">
          <OrriiiLogo />
        </Link>
        <Link className="not-found-page__home-link" href="/">
          Go home <span aria-hidden="true">→</span>
        </Link>
      </header>

      <section className="not-found-page__content" aria-labelledby="not-found-title">
        <span className="not-found-page__code" aria-hidden="true">404</span>
        <h1 id="not-found-title">Page not found</h1>
        <p>
          Looks like you took a wrong turn. The page you&apos;re looking for
          doesn&apos;t exist or has been moved.
        </p>

        <div className="not-found-page__actions">
          <Link className="not-found-page__primary" href="/">
            Go to homepage
          </Link>
          <Link className="not-found-page__secondary" href="/#how-it-works">
            See how it works
          </Link>
        </div>

        <ControlFlag />
      </section>
    </main>
  );
}
