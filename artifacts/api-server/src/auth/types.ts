export type UserRole = "employee" | "manager" | "admin";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  departmentId: number | null;
};
