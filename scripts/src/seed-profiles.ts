/**
 * Ensures password_hash exists, then upserts admin + employee with bcrypt hashes.
 * Loads DATABASE_URL from repo root .env (run from monorepo root: pnpm --filter @workspace/scripts run seed-profiles).
 *
 * Contraseñas fijas y simples (solo para depuración local / Railway); cámbialas en producción.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

config({ path: join(repoRoot, ".env") });
config({ path: join(repoRoot, ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL no está definido. Añádelo en la raíz del repo (.env).");
  process.exit(1);
}

async function columnExists(client: pg.Client): Promise<boolean> {
  const { rows } = await client.query<{ exists: boolean }>(
    `select exists(
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'users' and column_name = 'password_hash'
     ) as exists`,
  );
  return Boolean(rows[0]?.exists);
}

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    if (!(await columnExists(client))) {
      const migrationPath = join(repoRoot, "scripts/migrations/001_add_users_password_hash.sql");
      const sql = readFileSync(migrationPath, "utf8");
      await client.query(sql);
      console.log("Migración aplicada: columna password_hash añadida a public.users.");
    } else {
      console.log("La columna password_hash ya existe en public.users.");
    }

    const adminPassword = "Admin12345";
    const employeePassword = "Empleado12345";

    const adminHash = await bcrypt.hash(adminPassword, 10);
    const employeeHash = await bcrypt.hash(employeePassword, 10);

    await client.query(
      `insert into public.users (name, email, role, password_hash)
       values ($1, $2, 'admin'::public.user_role, $3)
       on conflict (email) do update set
         name = excluded.name,
         role = excluded.role,
         password_hash = excluded.password_hash`,
      ["Admin Sistema", "admin@empresa.com", adminHash],
    );

    await client.query(
      `insert into public.users (name, email, role, password_hash)
       values ($1, $2, 'employee'::public.user_role, $3)
       on conflict (email) do update set
         name = excluded.name,
         role = excluded.role,
         password_hash = excluded.password_hash`,
      ["Lyamm Job Castillo Cruz", "lyamm@empresa.com", employeeHash],
    );

    const { rows } = await client.query<{
      email: string;
      role: string;
      has_hash: boolean;
      hash_prefix: string;
    }>(
      `select email, role::text,
              (password_hash is not null and length(password_hash) > 0) as has_hash,
              left(password_hash, 7) || '…' as hash_prefix
       from public.users
       where email in ('admin@empresa.com', 'lyamm@empresa.com')
       order by email`,
    );

    console.log("\nVerificación en base de datos (hash truncado en log):");
    for (const r of rows) {
      console.log(`  ${r.email} | rol=${r.role} | hash presente=${r.has_hash} | inicio=${r.hash_prefix}`);
    }

    console.log("\n========== CREDENCIALES (simples, para descartar problemas de teclado/caracteres) ==========");
    console.log("Administrador  admin@empresa.com   →   Admin12345");
    console.log("Empleado       lyamm@empresa.com   →   Empleado12345");
    console.log("========================================================================================\n");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
