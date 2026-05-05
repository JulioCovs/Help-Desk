import { Router, type IRouter } from "express";
import { db, ticketsTable, departmentsTable, commentsTable, type Ticket } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { requireAuth } from "../auth/middleware";
import { canAccessTicket } from "../auth/access";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/tickets", async (req, res) => {
  try {
    const user = req.authUser!;
    const { departmentId, status, priority, createdBy } = req.query;

    const conditions = [];

    if (user.role === "employee") {
      conditions.push(eq(ticketsTable.createdBy, user.name));
    } else if (user.role === "manager" && user.departmentId != null) {
      conditions.push(eq(ticketsTable.departmentId, user.departmentId));
    }

    if (user.role === "admin" || user.role === "manager") {
      if (departmentId) conditions.push(eq(ticketsTable.departmentId, parseInt(departmentId as string)));
      if (createdBy) conditions.push(eq(ticketsTable.createdBy, createdBy as string));
    }
    if (status) conditions.push(eq(ticketsTable.status, status as "open" | "in_progress" | "resolved" | "closed"));
    if (priority) conditions.push(eq(ticketsTable.priority, priority as "low" | "medium" | "high" | "urgent"));

    const whereExpr =
      conditions.length > 0
        ? conditions.length === 1
          ? conditions[0]
          : and(...conditions)
        : undefined;

    const tickets = await db
      .select({
        id: ticketsTable.id,
        title: ticketsTable.title,
        description: ticketsTable.description,
        status: ticketsTable.status,
        priority: ticketsTable.priority,
        progress: ticketsTable.progress,
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
      .where(whereExpr)
      .groupBy(ticketsTable.id, departmentsTable.name)
      .orderBy(ticketsTable.updatedAt);

    res.json(tickets.reverse());
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to get tickets");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.post("/tickets", async (req, res) => {
  try {
    const user = req.authUser!;
    const { title, description, priority, departmentId, createdBy } = req.body;
    if (!title || !description || !priority || !departmentId) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const author =
      user.role === "admin" && typeof createdBy === "string" && createdBy.trim()
        ? createdBy.trim()
        : user.name;

    const [ticket] = await db
      .insert(ticketsTable)
      .values({ title, description, priority, departmentId, createdBy: author, status: "open" })
      .returning();

    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, ticket.departmentId));
    res.status(201).json({ ...ticket, departmentName: dept?.name ?? null, commentCount: 0 });
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to create ticket");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.get("/tickets/:id", async (req, res) => {
  try {
    const user = req.authUser!;
    const id = parseInt(req.params.id);
    const [ticket] = await db
      .select({
        id: ticketsTable.id,
        title: ticketsTable.title,
        description: ticketsTable.description,
        status: ticketsTable.status,
        priority: ticketsTable.priority,
        progress: ticketsTable.progress,
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

    if (!ticket) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!canAccessTicket(user, ticket)) {
      res.status(403).json({ error: "Acceso no autorizado" });
      return;
    }
    res.json(ticket);
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to get ticket");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.patch("/tickets/:id", async (req, res) => {
  try {
    const user = req.authUser!;
    const id = parseInt(req.params.id);
    const [existing] = await db
      .select({
        id: ticketsTable.id,
        departmentId: ticketsTable.departmentId,
        createdBy: ticketsTable.createdBy,
      })
      .from(ticketsTable)
      .where(eq(ticketsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!canAccessTicket(user, existing)) {
      res.status(403).json({ error: "Acceso no autorizado" });
      return;
    }

    const { title, description, status, priority, assignedTo, progress } = req.body;

    const updateFields: Partial<
      Pick<Ticket, "title" | "description" | "status" | "priority" | "assignedTo" | "progress">
    > & { updatedAt: Date } = { updatedAt: new Date() };
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (status !== undefined) updateFields.status = status;
    if (priority !== undefined) updateFields.priority = priority;
    if (assignedTo !== undefined) updateFields.assignedTo = assignedTo;
    if (progress !== undefined) updateFields.progress = Math.max(0, Math.min(100, Number(progress)));

    const [ticket] = await db
      .update(ticketsTable)
      .set(updateFields)
      .where(eq(ticketsTable.id, id))
      .returning();

    if (!ticket) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, ticket.departmentId));
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(commentsTable)
      .where(eq(commentsTable.ticketId, id));

    res.json({ ...ticket, departmentName: dept?.name ?? null, commentCount: count });
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to update ticket");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.delete("/tickets/:id", async (req, res) => {
  try {
    const user = req.authUser!;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Acceso no autorizado" });
      return;
    }
    const id = parseInt(req.params.id);
    await db.delete(commentsTable).where(eq(commentsTable.ticketId, id));
    await db.delete(ticketsTable).where(eq(ticketsTable.id, id));
    res.status(204).send();
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to delete ticket");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default router;
