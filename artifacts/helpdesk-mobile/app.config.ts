import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Inyecta en el binario la URL del API (Railway, etc.) vía EAS:
 * define `EXPO_PUBLIC_API_URL` en secretos EAS o `.env` local (HTTPS del api-server Node).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ?? "";

  return {
    ...config,
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true,
        },
      },
    },
    android: {
      ...config.android,
      usesCleartextTraffic: true,
    },
    extra: {
      ...(typeof config.extra === "object" && config.extra !== null ? config.extra : {}),
      apiUrl,
    },
  } as ExpoConfig;
};
