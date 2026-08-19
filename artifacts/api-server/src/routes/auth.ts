import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { signAuthToken } from "../auth/jwt";
import { AUTH_COOKIE_NAME, clearCookieOptions, cookieOptions } from "../auth/cookie";
import { requireAuth } from "../auth/middleware";
import type { UserRole } from "../auth/types";
import { logger } from "../lib/logger";

const exposeAuthErrors =
  process.env.NODE_ENV !== "production" || process.env.EXPOSE_AUTH_ERRORS === "1";

const router: IRouter = Router();

function isUserRole(v: unknown): v is UserRole {
  return v === "employee" || v === "manager" || v === "admin";
}

router.post("/auth/login", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      res
        .status(400)
        .json({ error: "Se esperaba JSON con email, password y assertedRole (Content-Type: application/json)" });
      return;
    }

    const { email, password, assertedRole } = req.body as {
      email?: string;
      password?: string;
      assertedRole?: string;
    };
    if (!email || !password || !assertedRole) {
      res.status(400).json({ error: "email, password y assertedRole son obligatorios" });
      return;
    }
    if (!isUserRole(assertedRole)) {
      res.status(400).json({ error: "assertedRole inválido" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
    if (!user) {
      res.status(401).json({ error: "Credenciales incorrectas" });
      return;
    }

    if (user.role !== assertedRole) {
      res.status(403).json({ error: "Acceso no autorizado" });
      return;
    }

    if (user.passwordHash) {
      let ok = false;
      try {
        ok = await bcrypt.compare(password, user.passwordHash);
      } catch (compareErr) {
        logger.error({ compareErr }, "bcrypt.compare failed (hash corrupto o inválido)");
        res.status(401).json({ error: "Credenciales incorrectas" });
        return;
      }
      if (!ok) {
        res.status(401).json({ error: "Credenciales incorrectas" });
        return;
      }
    } else {
      if (password.length < 8) {
        res.status(400).json({
          error: "Define una contraseña de al menos 8 caracteres (primer acceso para esta cuenta).",
        });
        return;
      }
      const hash = await bcrypt.hash(password, 10);
      await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.id, user.id));
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId ?? null,
    };
    const token = signAuthToken(authUser);
    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions());
    /** `token` permite clients móviles / Expo (sin cookies cross-origin) */
    res.json({ user: authUser, token });
    return;
  } catch (err) {
    (req as { log?: { error: (o: unknown, m: string) => void } }).log?.error({ err }, "Login failed");
    logger.error({ err }, "Login failed");
    const detail = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: "Error interno",
      ...(exposeAuthErrors ? { details: detail } : {}),
    });
    return;
  }
});

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };
    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "name, email, password y role son obligatorios" });
      return;
    }
    if (!isUserRole(role)) {
      res.status(400).json({ error: "role inválido" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
    if (existing.length > 0) {
      res.status(409).json({ error: "El correo ya está registrado" });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(usersTable)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        role,
        passwordHash: hash,
      })
      .returning();

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId ?? null,
    };
    const token = signAuthToken(authUser);
    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions());
    res.status(201).json({ user: authUser, token });
    return;
  } catch (err) {
    (req as { log?: { error: (o: unknown, m: string) => void } }).log?.error({ err }, "Register failed");
    logger.error({ err }, "Register failed");
    const detail = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: "Error interno",
      ...(exposeAuthErrors ? { details: detail } : {}),
    });
    return;
  }
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, clearCookieOptions());
  res.status(204).send();
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.authUser });
});

export default router;
