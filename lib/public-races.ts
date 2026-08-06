const API_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '').replace(/\/$/, '');

export type PublicAvatar = string | Record<string, unknown> | null;

export type PublicRace = {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  status: 'active' | 'finished';
  courseType: 'sprint' | 'classic' | 'night';
  difficulty: 'easy' | 'medium' | 'hard';
  startTime: string;
  endTime: string;
  location: { id?: string; name: string; region?: string };
  organizer: { id?: string; name: string; avatar?: PublicAvatar };
  course: { controlPointCount: number; distanceMeters: number };
  participantCount: number;
  maxParticipants?: number;
};

export type LeaderboardEntry = {
  userId: string;
  name: string;
  avatar?: PublicAvatar;
  cpFound: number;
  totalTimeSeconds: number;
  completedAt?: string;
};

export type PublicLeaderboard = {
  totalCPs: number;
  leaderboard: LeaderboardEntry[];
};

async function fetchPublic<T>(path: string): Promise<T | null> {
  if (!API_URL) return null;

  const response = await fetch(`${API_URL}${path}`, {
    next: { revalidate: 60 },
    headers: { Accept: 'application/json' },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Public race API returned ${response.status}`);
  return response.json() as Promise<T>;
}

export function getPublicRace(id: string) {
  return fetchPublic<PublicRace>(`/api/public/races/${encodeURIComponent(id)}`);
}

export function getPublicLeaderboard(id: string) {
  return fetchPublic<PublicLeaderboard>(`/api/public/races/${encodeURIComponent(id)}/leaderboard`);
}
