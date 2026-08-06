import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  const fingerprints = (process.env.ANDROID_SHA256_FINGERPRINTS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return NextResponse.json(fingerprints.length ? [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: process.env.ANDROID_PACKAGE || 'com.orienteering.mobile',
      sha256_cert_fingerprints: fingerprints,
    },
  }] : [], {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json',
    },
  });
}
