const DEFAULT_APP_STORE_URL = "https://apps.apple.com/az/app/orin-discover-city/id6782856488";
const configuredAppStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || DEFAULT_APP_STORE_URL;

function getValidAppStoreUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const APP_STORE_URL = getValidAppStoreUrl(configuredAppStoreUrl) ?? DEFAULT_APP_STORE_URL;
export const APP_STORE_FALLBACK = DEFAULT_APP_STORE_URL;
