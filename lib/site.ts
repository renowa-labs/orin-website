const fallbackSiteUrl = "https://orriii.renowa-labs.com";

function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    return new URL(configuredUrl || fallbackSiteUrl).origin;
  } catch {
    return fallbackSiteUrl;
  }
}

export const SITE_URL = getSiteUrl();
