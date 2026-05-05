import { db, departmentsTable, usersTable } from "@workspace/db";

async function seed() {
  console.log("Seeding departments...");

  const depts = [
    {
      name: "Sistemas / TI",
      description: "Soporte técnico, redes, infraestructura y software",
      icon: "monitor",
      color: "#1D4ED8",
      contactEmail: "sistemas@empresa.com",
      contactPhone: "555-0101",
    },
    {
      name: "Mantenimiento",
      description: "Mantenimiento de equipos, instalaciones y maquinaria",
      icon: "tool",
      color: "#D97706",
      contactEmail: "mantenimiento@empresa.com",
      contactPhone: "555-0102",
    },
    {
      name: "Recursos Humanos",
      description: "Nómina, contrataciones, prestaciones y clima laboral",
      icon: "users",
      color: "#7C3AED",
      contactEmail: "rh@empresa.com",
      contactPhone: "555-0103",
    },
    {
      name: "Producción",
      description: "Operaciones de planta, líneas de producción y calidad",
      icon: "cog",
      color: "#059669",
      contactEmail: "produccion@empresa.com",
      contactPhone: "555-0104",
    },
    {
      name: "Finanzas",
      description: "Contabilidad, pagos, presupuesto y facturación",
      icon: "dollar-sign",
      color: "#DC2626",
      contactEmail: "finanzas@empresa.com",
      contactPhone: "555-0105",
    },
    {
      name: "Logística",
      description: "Almacén, distribución, envíos y proveedores",
      icon: "truck",
      color: "#0891B2",
      contactEmail: "logistica@empresa.com",
      contactPhone: "555-0106",
    },
  ];

  for (const dept of depts) {
    await db
      .insert(departmentsTable)
      .values(dept)
      .onConflictDoNothing();
  }

  console.log("Seeding users...");

  const users = [
    { name: "Admin Sistema", email: "admin@empresa.com", role: "admin" as const },
    { name: "María González", email: "mgonzalez@empresa.com", role: "manager" as const },
    { name: "Carlos López", email: "clopez@empresa.com", role: "employee" as const },
    { name: "Ana Martínez", email: "amartinez@empresa.com", role: "employee" as const },
  ];

  for (const user of users) {
    await db
      .insert(usersTable)
      .values(user)
      .onConflictDoNothing();
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
