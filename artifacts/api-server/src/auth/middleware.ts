import type { RequestHandler } from "express";
import { verifyAuthToken } from "./jwt";
import { AUTH_COOKIE_NAME } from "./cookie";
import type { UserRole } from "./types";

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  const bearer =
    typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  const cookieToken =
    typeof req.cookies?.[AUTH_COOKIE_NAME] === "string" ? req.cookies[AUTH_COOKIE_NAME] : null;
  const token = bearer || cookieToken;
  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const user = verifyAuthToken(token);
  if (!user) {
    res.status(401).json({ error: "Sesión inválida" });
    return;
  }
  req.authUser = user;
  next();
};

export function requireRoles(...roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    const u = req.authUser;
    if (!u) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    if (!roles.includes(u.role)) {
      res.status(403).json({ error: "Acceso no autorizado" });
      return;
    }
    next();
  };
}
