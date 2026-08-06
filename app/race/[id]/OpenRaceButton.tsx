'use client';

import { useMemo } from 'react';

type Props = {
  raceId: string;
  className?: string;
};

const IOS_STORE_URL = process.env.NEXT_PUBLIC_IOS_STORE_URL || '/download';
const ANDROID_STORE_URL = process.env.NEXT_PUBLIC_ANDROID_STORE_URL || '/download';

export default function OpenRaceButton({ raceId, className }: Props) {
  const fallbackUrl = useMemo(() => {
    if (typeof navigator === 'undefined') return '/download';
    return /android/i.test(navigator.userAgent) ? ANDROID_STORE_URL : IOS_STORE_URL;
  }, []);

  const openRace = () => {
    const startedAt = Date.now();
    window.location.href = `orriii://race/${encodeURIComponent(raceId)}`;

    window.setTimeout(() => {
      if (document.visibilityState === 'visible' && Date.now() - startedAt < 2200) {
        window.location.href = fallbackUrl;
      }
    }, 1300);
  };

  return (
    <button type="button" className={className} onClick={openRace}>
      Open or start in Orriii
    </button>
  );
}
