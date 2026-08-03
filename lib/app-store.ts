const configuredAppStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() ?? "";

function getValidAppStoreUrl(value: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const APP_STORE_URL = getValidAppStoreUrl(configuredAppStoreUrl);
export const APP_STORE_FALLBACK = "/contact?interest=app-store";
