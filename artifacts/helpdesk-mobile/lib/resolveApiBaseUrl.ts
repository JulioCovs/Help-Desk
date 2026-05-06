import Constants from "expo-constants";
import * as Device from "expo-device";

/** URL del api-server en producción (Railway); fallback en __DEV__ si falta EXPO_PUBLIC_API_URL */
const PRODUCTION_API_BASE_URL = "https://help-desk-production-c1fd.up.railway.app";

/** Evita usar URLs plantilla de eas.json que rompen el fetch con "Network request failed" */
const PLACEHOLDER_SNIPPETS = ["your_api_service", "your-api-service", "xxxx.up.railway", "tu-proyecto"];

function isPlaceholderUrl(url: string): boolean {
  const lower = url.trim().toLowerCase();
  return PLACEHOLDER_SNIPPETS.some((s) => lower.includes(s));
}

function pickFirstValid(...candidates: Array<string | undefined | null>): string | null {
  for (const c of candidates) {
    const t = c?.trim().replace(/\/+$/, "");
    if (t && !isPlaceholderUrl(t)) return t;
  }
  return null;
}

/**
 * Origen del API HTTP (sin barra final).
 * Prioridad: EXPO_PUBLIC_API_URL → extra.apiUrl (build) → EXPO_PUBLIC_DOMAIN.
 * En __DEV__: si no hay EXPO_PUBLIC_API_URL, se usa el mismo origen HTTPS que producción (Railway).
 */
export function resolveApiBaseUrl(): string | null {
  const fromEnv = pickFirstValid(process.env.EXPO_PUBLIC_API_URL);
  if (fromEnv) return fromEnv;

  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const fromExtra = pickFirstValid(extra?.apiUrl);
  if (fromExtra) return fromExtra;

  const domain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  if (domain) {
    const host = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${host}`;
  }

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    if (Device.isDevice) {
      return null;
    }
    return PRODUCTION_API_BASE_URL;
  }

  return null;
}
