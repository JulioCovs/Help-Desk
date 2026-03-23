import { Router, type IRouter } from "express";
import { db, ticketsTable, departmentsTable, commentsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

const router: IRouter = Router();

router.get("/tickets", async (req, res) => {
  try {
    const { departmentId, status, priority, createdBy } = req.query;

    const conditions = [];
    if (departmentId) conditions.push(eq(ticketsTable.departmentId, parseInt(departmentId as string)));
    if (status) conditions.push(eq(ticketsTable.status, status as "open" | "in_progress" | "resolved" | "closed"));
    if (priority) conditions.push(eq(ticketsTable.priority, priority as "low" | "medium" | "high" | "urgent"));
    if (createdBy) conditions.push(eq(ticketsTable.createdBy, createdBy as string));

    const tickets = await db
      .select({
        id: ticketsTable.id,
        title: ticketsTable.title,
        description: ticketsTable.description,
        status: ticketsTable.status,
        priority: ticketsTable.priority,
        departmentId: ticketsTable.departmentId,
        departmentName: departmentsTable.name,
        createdBy: ticketsTable.createdBy,
        assignedTo: ticketsTable.assignedTo,
        createdAt: ticketsTable.createdAt,
        updatedAt: ticketsTable.updatedAt,
        commentCount: sql<number>`count(${commentsTable.id})::int`.as("comment_count"),
      })
      .from(ticketsTable)
      .leftJoin(departmentsTable, eq(departmentsTable.id, ticketsTable.departmentId))
      .leftJoin(commentsTable, eq(commentsTable.ticketId, ticketsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(ticketsTable.id, departmentsTable.name)
      .orderBy(ticketsTable.updatedAt);

    res.json(tickets.reverse());
  } catch (err) {
    req.log.error({ err }, "Failed to get tickets");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/tickets", async (req, res) => {
  try {
    const { title, description, priority, departmentId, createdBy } = req.body;
    if (!title || !description || !priority || !departmentId || !createdBy) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [ticket] = await db
      .insert(ticketsTable)
      .values({ title, description, priority, departmentId, createdBy, status: "open" })
      .returning();

    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, ticket.departmentId));
    res.status(201).json({ ...ticket, departmentName: dept?.name ?? null, commentCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create ticket");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tickets/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [ticket] = await db
      .select({
        id: ticketsTable.id,
        title: ticketsTable.title,
        description: ticketsTable.description,
        status: ticketsTable.status,
        priority: ticketsTable.priority,
        departmentId: ticketsTable.departmentId,
        departmentName: departmentsTable.name,
        createdBy: ticketsTable.createdBy,
        assignedTo: ticketsTable.assignedTo,
        createdAt: ticketsTable.createdAt,
        updatedAt: ticketsTable.updatedAt,
        commentCount: sql<number>`count(${commentsTable.id})::int`.as("comment_count"),
      })
      .from(ticketsTable)
      .leftJoin(departmentsTable, eq(departmentsTable.id, ticketsTable.departmentId))
      .leftJoin(commentsTable, eq(commentsTable.ticketId, ticketsTable.id))
      .where(eq(ticketsTable.id, id))
      .groupBy(ticketsTable.id, departmentsTable.name);

    if (!ticket) return res.status(404).json({ error: "Not found" });
    res.json(ticket);
  } catch (err) {
    req.log.error({ err }, "Failed to get ticket");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/tickets/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, status, priority, assignedTo } = req.body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    const [ticket] = await db
      .update(ticketsTable)
      .set(updateData as Parameters<typeof db.update>[0] extends infer T ? T : never)
      .where(eq(ticketsTable.id, id))
      .returning();

    if (!ticket) return res.status(404).json({ error: "Not found" });

    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, ticket.departmentId));
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(commentsTable)
      .where(eq(commentsTable.ticketId, id));

    res.json({ ...ticket, departmentName: dept?.name ?? null, commentCount: count });
  } catch (err) {
    req.log.error({ err }, "Failed to update ticket");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/tickets/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(commentsTable).where(eq(commentsTable.ticketId, id));
    await db.delete(ticketsTable).where(eq(ticketsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete ticket");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
