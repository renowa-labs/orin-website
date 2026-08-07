import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrriiiLogo } from "@/components/site/OrriiiLogo";
import { ScrollAwareHeader } from "@/components/site/ScrollAwareHeader";
import { getPublicLeaderboard, getPublicRace } from "@/lib/public-races";
import { SITE_URL } from "@/lib/site";
import OpenRaceButton from "./OpenRaceButton";
import RaceCourseMap from "./RaceCourseMap";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDistance(meters: number) {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${meters} m`;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const race = await getPublicRace(id);

  if (!race) return { title: "Race not found" };

  const description =
    race.description ||
    `${race.course.controlPointCount} checkpoints in ${race.location.name}.`;
  const canonical = `${SITE_URL}/race/${race.id}`;
  const images = race.coverImage
    ? [{ url: race.coverImage }]
    : [{ url: "/og.png", width: 1200, height: 630 }];

  return {
    title: race.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${race.title} — Orriii`,
      description,
      url: canonical,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${race.title} — Orriii`,
      description,
      images: race.coverImage ? [race.coverImage] : ["/og.png"],
    },
  };
}

export default async function RacePage({ params }: Props) {
  const { id } = await params;
  const [race, leaderboard] = await Promise.all([
    getPublicRace(id),
    getPublicLeaderboard(id),
  ]);

  if (!race) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: race.title,
    description: race.description,
    startDate: race.startTime,
    endDate: race.endTime,
    eventStatus:
      race.status === "finished"
        ? "https://schema.org/EventCompleted"
        : "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: race.location.name,
      address: race.location.region,
    },
    organizer: {
      "@type": "Organization",
      name: race.organizer.name,
    },
    url: `${SITE_URL}/race/${race.id}`,
  };

  const leaderboardEntries = leaderboard?.leaderboard ?? [];
  const hasPublicMap = Boolean(
    race.map && race.course.controlPoints?.length,
  );

  return (
    <div className="race-page">
      <ScrollAwareHeader
        ariaLabel="Race page navigation"
        navItems={[
          { label: "Race details", href: "#race-details" },
          { label: "Leaderboard", href: "#leaderboard" },
        ]}
        className="site-header race-header"
      />

      <main>
        <section
          className="race-hero"
          id="race-details"
          aria-labelledby="race-title"
        >
          <div className="race-hero__copy">
            <span className="section-eyebrow">
              {race.status === "active" ? "LIVE RACE" : "COMPLETED RACE"}
              {" / "}
              {race.courseType.toUpperCase()}
            </span>

            <h1 id="race-title">{race.title}</h1>

            <p className="race-hero__description">
              {race.description ||
                "Find every checkpoint, choose your route and finish fast."}
            </p>

            <p className="race-hero__location">
              {race.location.name}
              {race.location.region ? `, ${race.location.region}` : ""}
            </p>

            <dl className="race-stats">
              <div>
                <dt>Checkpoints</dt>
                <dd>{race.course.controlPointCount}</dd>
              </div>
              <div>
                <dt>Course</dt>
                <dd>{formatDistance(race.course.distanceMeters)}</dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>{race.participantCount}</dd>
              </div>
              <div>
                <dt>Difficulty</dt>
                <dd>{race.difficulty}</dd>
              </div>
            </dl>

            <div className="race-hero__actions">
              <OpenRaceButton
                raceId={race.id}
                className="primary-action race-open-action"
              />
              <p>
                Opens this exact race in Orriii. The store fallback only runs
                after you tap.
              </p>
            </div>
          </div>

          <div className="race-course" aria-label="Event course map">
            <div className="race-course__meta">
              <span>COURSE MAP</span>
              <strong>{race.course.controlPointCount} CHECKPOINTS</strong>
            </div>

            {hasPublicMap && race.map ? (
              <RaceCourseMap
                controlPoints={race.course.controlPoints}
                map={race.map}
              />
            ) : (
              <div className="race-course__graphic race-course__graphic--unavailable">
                <span>Course map data is not available yet.</span>
              </div>
            )}

            <p>
              The map shows the event&apos;s real checkpoint positions and course
              line. Open the race in Orriii to join and navigate it live.
            </p>
          </div>
        </section>

        <section
          className="race-leaderboard-section"
          id="leaderboard"
          aria-labelledby="leaderboard-title"
        >
          <div className="race-leaderboard-section__intro">
            <span className="section-eyebrow">RACE RESULTS</span>
            <h2 id="leaderboard-title">Leaderboard</h2>
            <p>
              Best completed attempt per participant, ranked by checkpoints
              found and finishing time.
            </p>
          </div>

          <div className="race-leaderboard">
            {leaderboardEntries.slice(0, 8).map((entry, index) => (
              <div className="race-leaderboard__row" key={entry.userId}>
                <span className="race-leaderboard__rank">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="race-leaderboard__avatar" aria-hidden="true">
                  {getInitials(entry.name)}
                </span>
                <strong>{entry.name}</strong>
                <span className="race-leaderboard__result">
                  {entry.cpFound}/{leaderboard?.totalCPs}
                  {" · "}
                  {formatTime(entry.totalTimeSeconds)}
                </span>
              </div>
            ))}

            {leaderboardEntries.length === 0 ? (
              <p className="race-leaderboard__empty">
                No finishers yet. The first result could be yours.
              </p>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="orriii-footer race-footer">
        <Link href="/" aria-label="Orriii home">
          <OrriiiLogo />
        </Link>
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
          <Link href="/">Explore</Link>
          <Link href="/download">Download</Link>
          <Link href="/privacy">Privacy</Link>
          <span>© {new Date().getFullYear()} ORRIII</span>
        </div>
      </footer>

      <div className="race-sticky-action">
        <div>
          <strong>{race.title}</strong>
          <span>{race.location.name}</span>
        </div>
        <OpenRaceButton
          raceId={race.id}
          className="primary-action race-sticky-action__button"
        />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>
  );
}