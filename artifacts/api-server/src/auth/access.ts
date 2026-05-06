import type { AuthUser } from "./types";
import { normalizeEmail } from "../lib/email-normalize";

export type TicketRow = {
  id: number;
  departmentId: number;
  createdBy: string;
  createdByUserId?: number | null;
  createdByEmail?: string | null;
};

export function canAccessTicket(user: AuthUser, ticket: TicketRow): boolean {
  if (user.role === "admin") return true;
  if (user.role === "manager") {
    if (user.departmentId == null) return true;
    return ticket.departmentId === user.departmentId;
  }
  if (ticket.createdByUserId != null && ticket.createdByUserId === user.id) {
    return true;
  }
  if (ticket.createdByEmail != null && ticket.createdByEmail.trim() !== "") {
    return normalizeEmail(ticket.createdByEmail) === normalizeEmail(user.email);
  }
  return false;
}
