import jwt from "jsonwebtoken";
import type { AuthUser } from "./types";

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET must be set to a random string of at least 16 characters.");
  }
  return s;
}

export function signAuthToken(user: AuthUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    },
    getSecret(),
    { expiresIn: "7d" },
  );
}

export function verifyAuthToken(token: string): AuthUser | null {
  try {
    const p = jwt.verify(token, getSecret()) as jwt.JwtPayload;
    const sub = p.sub;
    const id = typeof sub === "string" ? parseInt(sub, 10) : typeof sub === "number" ? sub : NaN;
    if (!Number.isFinite(id)) return null;
    if (typeof p.email !== "string" || typeof p.name !== "string" || typeof p.role !== "string") {
      return null;
    }
    if (p.role !== "employee" && p.role !== "manager" && p.role !== "admin") return null;
    const departmentId =
      p.departmentId === undefined || p.departmentId === null ? null : Number(p.departmentId);
    return {
      id,
      email: p.email,
      name: p.name,
      role: p.role,
      departmentId: Number.isFinite(departmentId as number) ? (departmentId as number) : null,
    };
  } catch {
    return null;
  }
}
