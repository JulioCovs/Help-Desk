import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

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
 * En __DEV__: solo simulador/emulador/web usa localhost; dispositivo físico exige EXPO_PUBLIC_API_URL (HTTPS Railway o LAN).
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
    if (Platform.OS === "web") {
      return "http://127.0.0.1:3001";
    }
    if (Platform.OS === "android") {
      return "http://10.0.2.2:3001";
    }
    return "http://127.0.0.1:3001";
  }

  return null;
}
