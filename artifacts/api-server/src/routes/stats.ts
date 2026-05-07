import { Router, type IRouter } from "express";
import { db, ticketsTable, departmentsTable, usersTable } from "@workspace/db";
import { eq, or, sql } from "drizzle-orm";
import { requireAuth } from "../auth/middleware";
import { normalizeEmail } from "../lib/email-normalize";

const router: IRouter = Router();

router.use(requireAuth);

const EMPTY_AGG = {
  total: 0,
  open: 0,
  inProgress: 0,
  resolved: 0,
  closed: 0,
  urgent: 0,
};

router.get("/stats", async (req, res) => {
  try {
    const user = req.authUser!;

    /** Solo empleado: agregados de sus tickets (email en sesión). Admin y supervisor: sin filtro (totales globales). */
    const emailNorm = normalizeEmail(user.email);
    const ticketWhere =
      user.role === "employee"
        ? or(
            eq(ticketsTable.createdByUserId, user.id),
            sql`lower(trim(coalesce(${ticketsTable.createdByEmail}, ''))) = ${emailNorm}`,
          )
        : undefined;

    const ticketSelect = db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where ${ticketsTable.status} = 'open')::int`,
        inProgress: sql<number>`count(*) filter (where ${ticketsTable.status} = 'in_progress')::int`,
        resolved: sql<number>`count(*) filter (where ${ticketsTable.status} = 'resolved')::int`,
        closed: sql<number>`count(*) filter (where ${ticketsTable.status} = 'closed')::int`,
        urgent: sql<number>`count(*) filter (where ${ticketsTable.priority} = 'urgent')::int`,
      })
      .from(ticketsTable);

    const ticketQuery = ticketWhere ? ticketSelect.where(ticketWhere) : ticketSelect;

    const rows = await ticketQuery;

    const ticketStats = { ...EMPTY_AGG, ...rows[0] };

    if (user.role === "admin") {
      const [{ deptCount }] = await db
        .select({ deptCount: sql<number>`count(*)::int` })
        .from(departmentsTable);

      const [{ userCount }] = await db
        .select({ userCount: sql<number>`count(*)::int` })
        .from(usersTable);

      return res.json({
        totalTickets: ticketStats.total,
        openTickets: ticketStats.open,
        inProgressTickets: ticketStats.inProgress,
        resolvedTickets: ticketStats.resolved,
        closedTickets: ticketStats.closed,
        urgentTickets: ticketStats.urgent,
        totalDepartments: deptCount,
        totalUsers: userCount,
      });
    }

    const deptQuery = db.select({ deptCount: sql<number>`count(*)::int` }).from(departmentsTable);
    const [{ deptCount }] =
      user.role === "manager" && user.departmentId != null
        ? await deptQuery.where(eq(departmentsTable.id, user.departmentId))
        : await deptQuery;

    res.json({
      totalTickets: ticketStats.total,
      openTickets: ticketStats.open,
      inProgressTickets: ticketStats.inProgress,
      resolvedTickets: ticketStats.resolved,
      closedTickets: ticketStats.closed,
      urgentTickets: ticketStats.urgent,
      totalDepartments: deptCount,
      totalUsers: 0,
    });
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default router;
