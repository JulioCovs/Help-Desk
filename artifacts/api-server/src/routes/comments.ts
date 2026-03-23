import { Router, type IRouter } from "express";
import { db, commentsTable, ticketsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/tickets/:id/comments", async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.ticketId, ticketId))
      .orderBy(commentsTable.createdAt);
    res.json(comments);
  } catch (err) {
    req.log.error({ err }, "Failed to get comments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/tickets/:id/comments", async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { content, authorName, isInternal } = req.body;

    if (!content || !authorName) {
      return res.status(400).json({ error: "content and authorName are required" });
    }

    const [comment] = await db
      .insert(commentsTable)
      .values({ ticketId, content, authorName, isInternal: isInternal ?? false })
      .returning();

    await db
      .update(ticketsTable)
      .set({ updatedAt: new Date() })
      .where(eq(ticketsTable.id, ticketId));

    res.status(201).json(comment);
  } catch (err) {
    req.log.error({ err }, "Failed to create comment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
