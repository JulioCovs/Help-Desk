import { Router, type IRouter } from "express";
import { db, departmentsTable, ticketsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/departments", async (req, res) => {
  try {
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
      .groupBy(departmentsTable.id)
      .orderBy(departmentsTable.name);
    res.json(departments);
  } catch (err) {
    req.log.error({ err }, "Failed to get departments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/departments", async (req, res) => {
  try {
    const { name, description, icon, color, contactEmail, contactPhone } = req.body;
    if (!name || !icon || !color) {
      return res.status(400).json({ error: "name, icon and color are required" });
    }
    const [dept] = await db
      .insert(departmentsTable)
      .values({ name, description, icon, color, contactEmail, contactPhone })
      .returning();
    res.status(201).json({ ...dept, ticketCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create department");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/departments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
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
    if (!dept) return res.status(404).json({ error: "Not found" });
    res.json(dept);
  } catch (err) {
    req.log.error({ err }, "Failed to get department");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
