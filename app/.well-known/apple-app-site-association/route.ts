import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  const teamId = process.env.APPLE_TEAM_ID;
  const bundleId = process.env.IOS_BUNDLE_ID || 'com.orienteering.mobile';

  return NextResponse.json({
    applinks: {
      apps: [],
      details: teamId
        ? [{ appID: `${teamId}.${bundleId}`, paths: ['/race/*'] }]
        : [],
    },
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json',
    },
  });
}
