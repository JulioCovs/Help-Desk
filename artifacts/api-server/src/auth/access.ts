import type { AuthUser } from "./types";

export type TicketRow = {
  id: number;
  departmentId: number;
  createdBy: string;
};

export function canAccessTicket(user: AuthUser, ticket: TicketRow): boolean {
  if (user.role === "admin") return true;
  if (user.role === "manager") {
    if (user.departmentId == null) return true;
    return ticket.departmentId === user.departmentId;
  }
  return ticket.createdBy === user.name;
}
