export type AppRole = "employee" | "manager" | "admin";

export const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "employee", label: "Empleado" },
  { value: "manager", label: "Supervisor" },
  { value: "admin", label: "Administrador" },
];

export function defaultPathForRole(role: AppRole): string {
  if (role === "admin") return "/";
  if (role === "manager") return "/departments";
  return "/tickets";
}
