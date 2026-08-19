export const AUTH_COOKIE_NAME = "hd_auth";

export function cookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export function clearCookieOptions(): { path: string; httpOnly: boolean; secure: boolean; sameSite: "lax" } {
  const secure = process.env.NODE_ENV === "production";
  return { path: "/", httpOnly: true, secure, sameSite: "lax" };
}
