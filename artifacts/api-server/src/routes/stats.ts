import { Router, type IRouter } from "express";
import { db, ticketsTable, departmentsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (req, res) => {
  try {
    const [ticketStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where ${ticketsTable.status} = 'open')::int`,
        inProgress: sql<number>`count(*) filter (where ${ticketsTable.status} = 'in_progress')::int`,
        resolved: sql<number>`count(*) filter (where ${ticketsTable.status} = 'resolved')::int`,
        closed: sql<number>`count(*) filter (where ${ticketsTable.status} = 'closed')::int`,
        urgent: sql<number>`count(*) filter (where ${ticketsTable.priority} = 'urgent')::int`,
      })
      .from(ticketsTable);

    const [{ deptCount }] = await db
      .select({ deptCount: sql<number>`count(*)::int` })
      .from(departmentsTable);

    const [{ userCount }] = await db
      .select({ userCount: sql<number>`count(*)::int` })
      .from(usersTable);

    res.json({
      totalTickets: ticketStats.total,
      openTickets: ticketStats.open,
      inProgressTickets: ticketStats.inProgress,
      resolvedTickets: ticketStats.resolved,
      closedTickets: ticketStats.closed,
      urgentTickets: ticketStats.urgent,
      totalDepartments: deptCount,
      totalUsers: userCount,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
