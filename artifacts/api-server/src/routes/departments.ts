import { Router, type IRouter } from "express";
import { db, departmentsTable, ticketsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRoles } from "../auth/middleware";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/departments", async (req, res) => {
  try {
    const user = req.authUser!;
    const deptScope =
      user.role === "manager" && user.departmentId != null
        ? eq(departmentsTable.id, user.departmentId)
        : undefined;

    const departments = await db
      .select({
        id: departmentsTable.id,
        name: departmentsTable.name,
        description: departmentsTable.description,
        icon: departmentsTable.icon,
        color: departmentsTable.color,
        contactEmail: departmentsTable.contactEmail,
        contactPhone: departmentsTable.contactPhone,
        createdAt: departmentsTable.createdAt,
        ticketCount: sql<number>`count(${ticketsTable.id})::int`.as("ticket_count"),
      })
      .from(departmentsTable)
      .leftJoin(ticketsTable, eq(ticketsTable.departmentId, departmentsTable.id))
      .where(deptScope)
      .groupBy(departmentsTable.id)
      .orderBy(departmentsTable.name);

    res.json(departments);
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to get departments");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.post("/departments", requireRoles("admin"), async (req, res) => {
  try {
    const { name, description, icon, color, contactEmail, contactPhone } = req.body;
    if (!name || !icon || !color) {
      res.status(400).json({ error: "name, icon and color are required" });
      return;
    }
    const [dept] = await db
      .insert(departmentsTable)
      .values({ name, description, icon, color, contactEmail, contactPhone })
      .returning();
    res.status(201).json({ ...dept, ticketCount: 0 });
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to create department");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.get("/departments/:id", async (req, res) => {
  try {
    const user = req.authUser!;
    const id = parseInt(req.params.id);
    if (user.role === "manager" && user.departmentId != null && id !== user.departmentId) {
      res.status(403).json({ error: "Acceso no autorizado" });
      return;
    }
    const [dept] = await db
      .select({
        id: departmentsTable.id,
        name: departmentsTable.name,
        description: departmentsTable.description,
        icon: departmentsTable.icon,
        color: departmentsTable.color,
        contactEmail: departmentsTable.contactEmail,
        contactPhone: departmentsTable.contactPhone,
        createdAt: departmentsTable.createdAt,
        ticketCount: sql<number>`count(${ticketsTable.id})::int`.as("ticket_count"),
      })
      .from(departmentsTable)
      .leftJoin(ticketsTable, eq(ticketsTable.departmentId, departmentsTable.id))
      .where(eq(departmentsTable.id, id))
      .groupBy(departmentsTable.id);
    if (!dept) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(dept);
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to get department");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default router;
