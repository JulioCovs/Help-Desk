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

    /** Empleado: por ID de usuario (preferido) o por email del creador (único, estable). */
    const emailNorm = normalizeEmail(user.email);
    const ticketWhere =
      user.role === "employee"
        ? or(
            eq(ticketsTable.createdByUserId, user.id),
            sql`lower(trim(coalesce(${ticketsTable.createdByEmail}, ''))) = ${emailNorm}`,
          )
        : user.role === "manager" && user.departmentId != null
          ? eq(ticketsTable.departmentId, user.departmentId)
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

    if (user.role === "employee") {
      const compiled = ticketQuery.toSQL();
      console.log("[stats/debug] JWT user.email (from req.authUser):", user.email);
      console.log("[stats/debug] normalized email (filter):", emailNorm);
      console.log("[stats/debug] JWT user.id:", user.id, "role:", user.role);
      console.log("[stats/debug] Drizzle SQL:", compiled.sql);
      console.log("[stats/debug] Drizzle params:", compiled.params);
    }

    const rows = await ticketQuery;

    if (user.role === "employee") {
      console.log("[stats/debug] SQL aggregate row(s) returned:", JSON.stringify(rows));
    }

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
