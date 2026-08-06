import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicLeaderboard, getPublicRace } from '@/lib/public-races';
import { SITE_URL } from '@/lib/site';
import OpenRaceButton from './OpenRaceButton';
import styles from './race.module.css';

type Props = { params: Promise<{ id: string }> };

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const race = await getPublicRace(id);
  if (!race) return { title: 'Race not found' };

  const description = race.description || `${race.course.controlPointCount} checkpoints in ${race.location.name}.`;
  const canonical = `${SITE_URL}/race/${race.id}`;

  return {
    title: race.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${race.title} — Orriii`,
      description,
      url: canonical,
      type: 'website',
      images: race.coverImage ? [{ url: race.coverImage }] : [{ url: '/og.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${race.title} — Orriii`,
      description,
      images: race.coverImage ? [race.coverImage] : ['/og.png'],
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
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: race.title,
    description: race.description,
    startDate: race.startTime,
    endDate: race.endTime,
    eventStatus: race.status === 'finished' ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: race.location.name,
      address: race.location.region,
    },
    organizer: { '@type': 'Organization', name: race.organizer.name },
    url: `${SITE_URL}/race/${race.id}`,
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className={styles.header}>
        <a href="/" className={styles.brand}>orriii</a>
        <a href="/download" className={styles.download}>Get the app</a>
      </header>

      <section className={styles.hero}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.eyebrow}>{race.status === 'active' ? 'Live race' : 'Completed race'} · {race.courseType}</div>
        <h1>{race.title}</h1>
        <p className={styles.description}>{race.description || 'Find every checkpoint, choose your route, and finish fast.'}</p>
        <div className={styles.location}>{race.location.name}{race.location.region ? `, ${race.location.region}` : ''}</div>
        <div className={styles.stats}>
          <div><strong>{race.course.controlPointCount}</strong><span>checkpoints</span></div>
          <div><strong>{formatDistance(race.course.distanceMeters)}</strong><span>course</span></div>
          <div><strong>{race.participantCount}</strong><span>joined</span></div>
          <div><strong>{race.difficulty}</strong><span>difficulty</span></div>
        </div>
        <OpenRaceButton raceId={race.id} className={styles.primaryButton} />
        <p className={styles.ctaNote}>Opens this exact race in the app. No automatic store redirect.</p>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.courseCard}>
          <div className={styles.cardLabel}>Course preview</div>
          <div className={styles.courseVisual}>
            <div className={styles.routeLine} />
            {Array.from({ length: Math.min(race.course.controlPointCount, 7) }, (_, index) => (
              <span key={index} className={styles.control} style={{ left: `${12 + index * 12}%`, top: `${index % 2 ? 58 : 35}%` }}>{index + 1}</span>
            ))}
          </div>
          <p>Exact checkpoint positions stay hidden until the participant opens the race in Orriii.</p>
        </article>

        <article className={styles.leaderboardCard}>
          <div className={styles.cardLabel}>Leaderboard</div>
          <div className={styles.leaderboard}>
            {(leaderboard?.leaderboard || []).slice(0, 8).map((entry, index) => (
              <div className={styles.row} key={entry.userId}>
                <span className={styles.rank}>{index + 1}</span>
                <span className={styles.avatar}>{initials(entry.name)}</span>
                <span className={styles.name}>{entry.name}</span>
                <span className={styles.score}>{entry.cpFound}/{leaderboard?.totalCPs} · {formatTime(entry.totalTimeSeconds)}</span>
              </div>
            ))}
            {!leaderboard?.leaderboard.length && <p className={styles.empty}>No finishers yet. The first result could be yours.</p>}
          </div>
        </article>
      </section>

      <div className={styles.stickyCta}>
        <div><strong>{race.title}</strong><span>{race.location.name}</span></div>
        <OpenRaceButton raceId={race.id} className={styles.stickyButton} />
      </div>
    </main>
  );
}
