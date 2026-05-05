import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAuth, requireRoles } from "../auth/middleware";

const router: IRouter = Router();

router.use(requireAuth, requireRoles("admin"));

function stripPassword<T extends { passwordHash?: unknown }>(rows: T[]) {
  return rows.map(({ passwordHash: _p, ...rest }) => rest);
}

router.get("/users", async (req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.name);
    res.json(stripPassword(users));
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to get users");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.post("/users", async (req, res) => {
  try {
    const { name, email, role, departmentId, password } = req.body;
    if (!name || !email || !role) {
      res.status(400).json({ error: "name, email and role are required" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res.status(201).json(stripPassword([existing[0]])[0]);
      return;
    }

    const passwordHash =
      typeof password === "string" && password.length >= 8
        ? await bcrypt.hash(password, 10)
        : null;

    const [user] = await db
      .insert(usersTable)
      .values({ name, email, role, departmentId, passwordHash })
      .returning();
    res.status(201).json(stripPassword([user])[0]);
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to create user");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default router;
