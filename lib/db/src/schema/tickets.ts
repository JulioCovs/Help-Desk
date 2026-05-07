import { integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);

export const ticketsTable = pgTable("tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").notNull().default("open"),
  priority: ticketPriorityEnum("priority").notNull().default("medium"),
  progress: integer("progress").notNull().default(0),
  departmentId: integer("department_id").notNull(),
  createdBy: text("created_by").notNull(),
  /** Quién creó el ticket (usuario auth); null en datos legacy o creación admin sin usuario resuelto */
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id),
  /** Email del creador (normalizado en inserción/ backfill) — filtro principal para empleados */
  createdByEmail: text("created_by_email"),
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** createdByEmail lo rellena el api-server desde JWT; puede omitirse en inserts parciales. */
export const insertTicketSchema = createInsertSchema(ticketsTable, {
  createdByEmail: z.string().trim().optional().nullable(),
  createdByUserId: z.number().int().positive().optional().nullable(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof ticketsTable.$inferSelect;
