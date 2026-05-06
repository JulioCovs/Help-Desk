import { Router, type IRouter } from "express";
import { db, commentsTable, ticketsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../auth/middleware";
import { canAccessTicket } from "../auth/access";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/tickets/:id/comments", async (req, res) => {
  try {
    const user = req.authUser!;
    const ticketId = parseInt(req.params.id);
    const [ticket] = await db
      .select({
        id: ticketsTable.id,
        departmentId: ticketsTable.departmentId,
        createdBy: ticketsTable.createdBy,
        createdByUserId: ticketsTable.createdByUserId,
        createdByEmail: ticketsTable.createdByEmail,
      })
      .from(ticketsTable)
      .where(eq(ticketsTable.id, ticketId));
    if (!ticket) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!canAccessTicket(user, ticket)) {
      res.status(403).json({ error: "Acceso no autorizado" });
      return;
    }

    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.ticketId, ticketId))
      .orderBy(commentsTable.createdAt);
    res.json(comments);
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to get comments");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

router.post("/tickets/:id/comments", async (req, res) => {
  try {
    const user = req.authUser!;
    const ticketId = parseInt(req.params.id);
    const [ticket] = await db
      .select({
        id: ticketsTable.id,
        departmentId: ticketsTable.departmentId,
        createdBy: ticketsTable.createdBy,
        createdByUserId: ticketsTable.createdByUserId,
        createdByEmail: ticketsTable.createdByEmail,
      })
      .from(ticketsTable)
      .where(eq(ticketsTable.id, ticketId));
    if (!ticket) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!canAccessTicket(user, ticket)) {
      res.status(403).json({ error: "Acceso no autorizado" });
      return;
    }

    const { content, authorName, isInternal } = req.body;

    if (!content) {
      res.status(400).json({ error: "content is required" });
      return;
    }

    const name =
      typeof authorName === "string" && authorName.trim() && user.role === "admin"
        ? authorName.trim()
        : user.name;

    const internal =
      user.role === "admin" ? (isInternal ?? false) : false;

    const [comment] = await db
      .insert(commentsTable)
      .values({ ticketId, content, authorName: name, isInternal: internal })
      .returning();

    await db
      .update(ticketsTable)
      .set({ updatedAt: new Date() })
      .where(eq(ticketsTable.id, ticketId));

    res.status(201).json(comment);
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to create comment");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default router;
