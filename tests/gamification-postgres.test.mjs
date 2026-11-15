import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

import { addCalendarDays, getWeekBoundsForInstant } from "../src/lib/gamification/calendar.mjs";
import { createSupabaseRoutineRepository } from "../src/lib/gamification/repository.mjs";
import { RoutineDomainError, createRoutineService } from "../src/lib/gamification/session.mjs";

function runCommandNoPipes(binPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(binPath, args, {
      stdio: "ignore",
      windowsHide: true,
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `Comando ${path.basename(binPath)} falhou (code=${code ?? "null"}, signal=${signal ?? "none"}).`,
        ),
      );
    });
  });
}

// Ajusta parsers globais do node-postgres para alinhar DATE (1082) e TIMESTAMPTZ (1184)
// ao formato ISO retornado pelo PostgREST/Supabase (e pelo PGlite no harness de teste).
pg.types.setTypeParser(1082, (val) => val);
pg.types.setTypeParser(1184, (val) => (val ? new Date(val).toISOString() : null));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const MIGRATION_053_SQL = fs.readFileSync(
  path.join(ROOT, "supabase", "migrations", "053_create_study_routine_gamification.sql"),
  "utf8",
);

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER_BLOCKED = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const UNIT_CONST_1 = "11111111-1111-4111-8111-111111111111";
const UNIT_CONST_2 = "22222222-2222-4222-8222-222222222222";
const UNIT_ADM_1 = "33333333-3333-4333-8333-333333333333";
const UNIT_ARCHIVED = "44444444-4444-4444-8444-444444444444";
const UNIT_NONEXISTENT = "99999999-9999-4999-8999-999999999999";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function makeTopicsFixture() {
  return [
    {
      topic_id: "const-art5",
      discipline: "Direito Constitucional",
      title: "Direitos Fundamentais - Artigo 5º",
      sort_order: 1,
      archived_at: null,
      sections: [
        {
          section_id: "const-art5-sec-01",
          content_unit_id: UNIT_CONST_1,
          title: "Caput e igualdade",
          sort_order: 1,
          archived_at: null,
          content_markdown: "Texto base para leitura de cinco minutos. ".repeat(35),
          callouts: [],
          mnemonics: [],
          flashcards: [],
          mermaid_mindmap: null,
        },
        {
          section_id: "const-art5-sec-02",
          content_unit_id: UNIT_CONST_2,
          title: "Legalidade e intimidade",
          sort_order: 2,
          archived_at: null,
          content_markdown: "Segunda seção constitucional. ".repeat(30),
          callouts: [],
          mnemonics: [],
          flashcards: [],
          mermaid_mindmap: null,
        },
      ],
    },
    {
      topic_id: "adm-principios",
      discipline: "Direito Administrativo",
      title: "Princípios da Administração Pública",
      sort_order: 2,
      archived_at: null,
      sections: [
        {
          section_id: "adm-principios-sec-01",
          content_unit_id: UNIT_ADM_1,
          title: "LIMPE na prática",
          sort_order: 1,
          archived_at: null,
          content_markdown: "Texto administrativo base. ".repeat(35),
          callouts: [],
          mnemonics: [],
          flashcards: [],
          mermaid_mindmap: null,
        },
      ],
    },
  ];
}

const BOOTSTRAP_SQL = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$;

GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS private.test_entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE OR REPLACE FUNCTION private.has_active_content_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT e.active FROM private.test_entitlements AS e WHERE e.user_id = (SELECT auth.uid())),
    false
  );
$$;

REVOKE ALL ON FUNCTION private.has_active_content_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_active_content_access() TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.topics (
  topic_id TEXT PRIMARY KEY,
  discipline TEXT,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sections (
  section_id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES public.topics(topic_id) ON DELETE CASCADE,
  content_unit_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_markdown TEXT,
  callouts JSONB NOT NULL DEFAULT '[]'::jsonb,
  mnemonics JSONB NOT NULL DEFAULT '[]'::jsonb,
  flashcards JSONB NOT NULL DEFAULT '[]'::jsonb,
  mermaid_mindmap TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES public.sections(section_id) ON DELETE CASCADE,
  content_unit_id UUID NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, section_id),
  UNIQUE (user_id, content_unit_id)
);

GRANT SELECT ON public.topics, public.sections TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_progress TO authenticated;
GRANT ALL ON public.topics, public.sections, public.user_progress TO service_role;
`;

function mapPgError(error) {
  const err = /** @type {Record<string, any>} */ (error ?? {});
  return {
    code: err.code ?? err.cause?.code ?? undefined,
    message: err.message ?? String(error),
  };
}

function assertIdent(name) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`Identificador SQL inválido no adaptador de teste: ${name}`);
  }
  return name;
}

const RPC_DEFS = {
  ensure_study_routine_weekly_plan: {
    returnsRow: false,
    args: [["p_auto_activate", "boolean", false]],
  },
  save_study_routine_preferences: {
    returnsRow: false,
    args: [
      ["p_target_days", "smallint", null],
      ["p_timezone_iana", "text", null],
      ["p_default_budget_minutes", "smallint", null],
      ["p_preferred_discipline", "text", null],
      ["p_clear_preferred_discipline", "boolean", false],
      ["p_hide_gamification", "boolean", null],
    ],
  },
  create_study_routine_session: {
    returnsRow: false,
    args: [
      ["p_budget_minutes", "smallint", null],
      ["p_selection_mode", "text", null],
      ["p_idempotency_key", "text", null],
      ["p_activities", "jsonb", []],
      ["p_replace_active", "boolean", false],
    ],
  },
  update_study_routine_session_status: {
    returnsRow: false,
    args: [
      ["p_session_id", "uuid", null],
      ["p_status", "text", null],
    ],
  },
  replace_study_routine_session_activity: {
    returnsRow: false,
    args: [
      ["p_session_id", "uuid", null],
      ["p_activity_id", "uuid", null],
      ["p_content_unit_id", "uuid", null],
      ["p_topic_id", "text", null],
      ["p_topic_title", "text", null],
      ["p_discipline", "text", null],
      ["p_section_id", "text", null],
      ["p_activity_title", "text", null],
      ["p_estimated_minutes", "smallint", null],
    ],
  },
  complete_study_routine_session: {
    returnsRow: true,
    args: [
      ["p_session_id", "uuid", null],
      ["p_completed_activity_ids", "uuid[]", []],
      ["p_completion_idempotency_key", "text", null],
      ["p_weekly_plan_id", "uuid", null],
    ],
  },
};

function encodePgArg(value, sqlType) {
  if (value === undefined || value === null) return null;
  if (sqlType === "jsonb") return JSON.stringify(value);
  if (sqlType === "uuid[]") {
    const items = Array.isArray(value) ? value : [];
    return `{${items.map((item) => String(item)).join(",")}}`;
  }
  return value;
}

function createSupabaseClientAdapter(runAsRole) {
  return {
    async rpc(fnName, params = {}) {
      const def = RPC_DEFS[fnName];
      if (!def) {
        return {
          data: null,
          error: { code: "PGRST202", message: `Unknown RPC ${fnName}` },
        };
      }

      try {
        const data = await runAsRole(async (db) => {
          const values = [];
          const placeholders = [];
          for (const [paramName, sqlType, fallback] of def.args) {
            const raw =
              Object.prototype.hasOwnProperty.call(params, paramName) &&
              params[paramName] !== undefined
                ? params[paramName]
                : fallback;
            values.push(encodePgArg(raw, sqlType));
            placeholders.push(`${paramName} := $${values.length}::${sqlType}`);
          }

          if (def.returnsRow) {
            const res = await db.query(
              `SELECT * FROM public.${assertIdent(fnName)}(${placeholders.join(", ")})`,
              values,
            );
            return res.rows[0] ?? null;
          }

          const res = await db.query(
            `SELECT public.${assertIdent(fnName)}(${placeholders.join(", ")}) AS result`,
            values,
          );
          return res.rows[0]?.result ?? null;
        });
        return { data, error: null };
      } catch (error) {
        return { data: null, error: mapPgError(error) };
      }
    },

    from(table) {
      const safeTable = assertIdent(table);
      const state = {
        op: "select",
        columns: "*",
        payload: null,
        filters: [],
        orders: [],
        limitCount: null,
        expectation: "many",
      };

      async function execute() {
        try {
          const rows = await runAsRole(async (db) => {
            const values = [];
            const whereParts = [];
            for (const filter of state.filters) {
              const col = assertIdent(filter.col);
              if (filter.kind === "eq") {
                values.push(filter.val);
                whereParts.push(`${col} = $${values.length}`);
              } else if (filter.kind === "gte") {
                values.push(filter.val);
                whereParts.push(`${col} >= $${values.length}`);
              } else if (filter.kind === "lte") {
                values.push(filter.val);
                whereParts.push(`${col} <= $${values.length}`);
              } else if (filter.kind === "in") {
                const arr = Array.isArray(filter.val) ? filter.val : [];
                if (arr.length === 0) {
                  whereParts.push("FALSE");
                } else {
                  const isUuid = arr.every((v) => typeof v === "string" && UUID_RE.test(v));
                  values.push(`{${arr.map((v) => String(v)).join(",")}}`);
                  whereParts.push(`${col} = ANY($${values.length}::${isUuid ? "uuid[]" : "text[]"})`);
                }
              }
            }

            const whereSql = whereParts.length > 0 ? ` WHERE ${whereParts.join(" AND ")}` : "";

            if (state.op === "select") {
              const orderSql =
                state.orders.length > 0
                  ? ` ORDER BY ${state.orders
                      .map((o) => `${assertIdent(o.col)} ${o.ascending ? "ASC" : "DESC"}`)
                      .join(", ")}`
                  : "";
              const limitSql =
                typeof state.limitCount === "number" ? ` LIMIT ${Math.max(0, state.limitCount)}` : "";
              const res = await db.query(
                `SELECT ${state.columns} FROM public.${safeTable}${whereSql}${orderSql}${limitSql}`,
                values,
              );
              return res.rows;
            }

            if (state.op === "insert") {
              const row = Array.isArray(state.payload) ? state.payload[0] : state.payload;
              const keys = Object.keys(row).map(assertIdent);
              const placeholders = keys.map((k) => {
                values.push(row[k]);
                return `$${values.length}`;
              });
              const res = await db.query(
                `INSERT INTO public.${safeTable} (${keys.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
                values,
              );
              return res.rows;
            }

            if (state.op === "update") {
              const keys = Object.keys(state.payload).map(assertIdent);
              const sets = keys.map((k) => {
                values.push(state.payload[k]);
                return `${k} = $${values.length}`;
              });
              const res = await db.query(
                `UPDATE public.${safeTable} SET ${sets.join(", ")}${whereSql} RETURNING *`,
                values,
              );
              return res.rows;
            }

            if (state.op === "delete") {
              const res = await db.query(
                `DELETE FROM public.${safeTable}${whereSql} RETURNING *`,
                values,
              );
              return res.rows;
            }

            return [];
          });

          if (state.expectation === "maybeSingle") {
            if (rows.length > 1) {
              return { data: null, error: { code: "PGRST116", message: "multiple rows" } };
            }
            return { data: rows[0] ?? null, error: null };
          }
          if (state.expectation === "single") {
            if (rows.length !== 1) {
              return { data: null, error: { code: "PGRST116", message: "row not unique" } };
            }
            return { data: rows[0], error: null };
          }
          return { data: rows, error: null };
        } catch (error) {
          return { data: null, error: mapPgError(error) };
        }
      }

      const builder = {
        select(columns = "*") {
          state.columns = columns;
          return builder;
        },
        insert(payload) {
          state.op = "insert";
          state.payload = payload;
          return builder;
        },
        update(payload) {
          state.op = "update";
          state.payload = payload;
          return builder;
        },
        delete() {
          state.op = "delete";
          return builder;
        },
        eq(col, val) {
          state.filters.push({ kind: "eq", col, val });
          return builder;
        },
        gte(col, val) {
          state.filters.push({ kind: "gte", col, val });
          return builder;
        },
        lte(col, val) {
          state.filters.push({ kind: "lte", col, val });
          return builder;
        },
        in(col, val) {
          state.filters.push({ kind: "in", col, val });
          return builder;
        },
        order(col, options = {}) {
          state.orders.push({ col, ascending: options.ascending !== false });
          return builder;
        },
        limit(count) {
          state.limitCount = count;
          return builder;
        },
        maybeSingle() {
          state.expectation = "maybeSingle";
          return execute();
        },
        single() {
          state.expectation = "single";
          return execute();
        },
        then(onFulfilled, onRejected) {
          return execute().then(onFulfilled, onRejected);
        },
      };

      return builder;
    },
  };
}

// Instância única PGlite WASM serializada em fila (usada para invariantes SQL/triggers/fuso;
// contenção real entre transações simultâneas é testada no PgPoolHarness com PostgreSQL nativo).
class PgliteHarness {
  constructor(db) {
    this.db = db;
    this.queue = Promise.resolve();
  }

  runSerialized(task) {
    const run = this.queue.then(task, task);
    this.queue = run.catch(() => {});
    return run;
  }

  async withAdminTx(callback) {
    return this.runSerialized(async () => {
      await this.db.exec("BEGIN");
      try {
        const result = await callback(this.db);
        await this.db.exec("COMMIT");
        return result;
      } catch (error) {
        try {
          await this.db.exec("ROLLBACK");
        } catch {
          // noop
        }
        throw error;
      }
    });
  }

  asUser(userId, role = "authenticated") {
    const runAsRole = async (callback) =>
      this.runSerialized(async () => {
        await this.db.exec("BEGIN");
        try {
          await this.db.exec(`SET LOCAL ROLE ${assertIdent(role)}`);
          await this.db.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [
            userId ?? "",
          ]);
          const result = await callback(this.db);
          await this.db.exec("COMMIT");
          return result;
        } catch (error) {
          try {
            await this.db.exec("ROLLBACK");
          } catch {
            // noop
          }
          throw error;
        }
      });

    return createSupabaseClientAdapter(runAsRole);
  }
}

// Pool real multi-conexão sobre pg.Pool SEM fila sequencial em JS: cada operação
// adquire sua própria conexão TCP e disputa locks reais no PostgreSQL.
class PgPoolHarness {
  constructor(pool, stopCluster) {
    this.pool = pool;
    this.stopCluster = stopCluster;
    this.db = {
      query: (sql, params) => this.pool.query(sql, params),
      close: async () => {
        await this.pool.end();
        if (this.stopCluster) {
          await this.stopCluster();
        }
      },
    };
  }

  async withAdminTx(callback) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // noop
      }
      throw error;
    } finally {
      client.release();
    }
  }

  asUser(userId, role = "authenticated") {
    const runAsRole = async (callback) => {
      const client = await this.pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`SET LOCAL ROLE ${assertIdent(role)}`);
        await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [
          userId ?? "",
        ]);
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        try {
          await client.query("ROLLBACK");
        } catch {
          // noop
        }
        throw error;
      } finally {
        client.release();
      }
    };

    return createSupabaseClientAdapter(runAsRole);
  }
}

async function bootstrapAndSeed(execSql, querySql) {
  await execSql(BOOTSTRAP_SQL);

  // Executa a migration 053 duas vezes para comprovar idempotência no PostgreSQL.
  await execSql(MIGRATION_053_SQL);
  await execSql(MIGRATION_053_SQL);

  await querySql(
    `INSERT INTO auth.users (id, email) VALUES ($1, $2), ($3, $4), ($5, $6)`,
    [
      USER_A,
      "aluna.a@example.com",
      USER_B,
      "aluno.b@example.com",
      USER_BLOCKED,
      "bloqueado@example.com",
    ],
  );
  await querySql(
    `INSERT INTO private.test_entitlements (user_id, active) VALUES ($1, true), ($2, true), ($3, false)`,
    [USER_A, USER_B, USER_BLOCKED],
  );

  await querySql(
    `INSERT INTO public.topics (topic_id, discipline, title, sort_order, archived_at) VALUES
      ('const-art5', 'Direito Constitucional', 'Direitos Fundamentais - Artigo 5º', 1, NULL),
      ('adm-principios', 'Direito Administrativo', 'Princípios da Administração Pública', 2, NULL),
      ('archived-topic', 'Direito Tributário', 'Tópico Arquivado', 3, now())`,
  );

  await querySql(
    `INSERT INTO public.sections (section_id, topic_id, content_unit_id, title, sort_order, archived_at) VALUES
      ('const-art5-sec-01', 'const-art5', $1, 'Caput e igualdade', 1, NULL),
      ('const-art5-sec-02', 'const-art5', $2, 'Legalidade e intimidade', 2, NULL),
      ('adm-principios-sec-01', 'adm-principios', $3, 'LIMPE na prática', 1, NULL),
      ('archived-sec-01', 'archived-topic', $4, 'Seção Arquivada', 1, now())`,
    [UNIT_CONST_1, UNIT_CONST_2, UNIT_ADM_1, UNIT_ARCHIVED],
  );
}

async function createSeededPostgres() {
  const db = new PGlite();
  await bootstrapAndSeed(
    (sql) => db.exec(sql),
    (sql, params) => db.query(sql, params),
  );
  return new PgliteHarness(db);
}

function findPostgresBinDir() {
  const ext = process.platform === "win32" ? ".exe" : "";
  const candidates = [];
  if (process.env.PG_BIN_DIR) {
    candidates.push(process.env.PG_BIN_DIR);
  }
  const pathEntries = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  candidates.push(...pathEntries);
  if (process.platform === "win32") {
    candidates.push(
      path.join(os.homedir(), "scoop", "apps", "postgresql", "current", "bin"),
      "C:\\Program Files\\PostgreSQL\\18\\bin",
      "C:\\Program Files\\PostgreSQL\\17\\bin",
      "C:\\Program Files\\PostgreSQL\\16\\bin",
    );
  } else {
    candidates.push("/usr/lib/postgresql/17/bin", "/usr/lib/postgresql/16/bin", "/usr/local/bin");
  }

  for (const dir of candidates) {
    const initdbPath = path.join(dir, `initdb${ext}`);
    const pgCtlPath = path.join(dir, `pg_ctl${ext}`);
    if (fs.existsSync(initdbPath) && fs.existsSync(pgCtlPath)) {
      return { dir, initdbPath, pgCtlPath };
    }
  }
  return null;
}

function getFreeTcpPort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const address = srv.address();
      if (!address || typeof address === "string") {
        srv.close(() => reject(new Error("Falha ao reservar porta TCP livre para PostgreSQL.")));
        return;
      }
      const { port } = address;
      srv.close(() => resolve(port));
    });
  });
}

async function removeDirWithRetry(dirPath) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
    }
  }
}

async function createRealPostgresHarness() {
  if (process.env.TEST_DATABASE_URL) {
    const dbName = `gamif_test_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const adminClient = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    await adminClient.connect();
    await adminClient.query(`CREATE DATABASE ${assertIdent(dbName)}`);
    await adminClient.end();

    const parsed = new URL(process.env.TEST_DATABASE_URL);
    parsed.pathname = `/${dbName}`;
    const testConnectionString = parsed.toString();
    const pool = new pg.Pool({ connectionString: testConnectionString, max: 16 });
    const seedClient = await pool.connect();
    try {
      await bootstrapAndSeed(
        (sql) => seedClient.query(sql),
        (sql, params) => seedClient.query(sql, params),
      );
    } finally {
      seedClient.release();
    }

    const cleanup = async () => {
      const cleanupClient = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
      await cleanupClient.connect();
      await cleanupClient.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [dbName],
      );
      await cleanupClient.query(`DROP DATABASE IF EXISTS ${assertIdent(dbName)}`);
      await cleanupClient.end();
    };

    return {
      harness: new PgPoolHarness(pool, cleanup),
      connectionConfig: { connectionString: testConnectionString },
    };
  }

  const bins = findPostgresBinDir();
  if (!bins) {
    return null;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pro-gamif-pg-"));
  const dataDir = path.join(tempDir, "data");
  const logFile = path.join(tempDir, "postgres.log");
  const port = await getFreeTcpPort();
  let started = false;

  const stopCluster = async () => {
    if (started) {
      await runCommandNoPipes(bins.pgCtlPath, ["-D", dataDir, "-m", "immediate", "-w", "stop"]).catch(
        () => {},
      );
      started = false;
    }
    await removeDirWithRetry(tempDir);
  };

  try {
    await runCommandNoPipes(bins.initdbPath, [
      "-D",
      dataDir,
      "-U",
      "postgres",
      "-A",
      "trust",
      "-E",
      "UTF8",
      "--locale=C",
      "--no-sync",
    ]);

    await runCommandNoPipes(bins.pgCtlPath, [
      "-D",
      dataDir,
      "-l",
      logFile,
      "-w",
      "-o",
      `-p ${port} -h 127.0.0.1`,
      "start",
    ]);
    started = true;

    const adminConfig = {
      host: "127.0.0.1",
      port,
      user: "postgres",
      database: "postgres",
    };
    const adminClient = new pg.Client(adminConfig);
    await adminClient.connect();
    await adminClient.query("CREATE DATABASE gamification_test");
    await adminClient.end();

    const connectionConfig = {
      host: "127.0.0.1",
      port,
      user: "postgres",
      database: "gamification_test",
    };
    const pool = new pg.Pool({ ...connectionConfig, max: 16 });
    const seedClient = await pool.connect();
    try {
      await bootstrapAndSeed(
        (sql) => seedClient.query(sql),
        (sql, params) => seedClient.query(sql, params),
      );
    } finally {
      seedClient.release();
    }

    return {
      harness: new PgPoolHarness(pool, stopCluster),
      connectionConfig,
    };
  } catch (error) {
    await stopCluster();
    throw error;
  }
}

test("PostgreSQL [P2 #4]: bloqueia DML direto para authenticated, aplica invariantes via trigger e faz cascade", async (t) => {
  const harness = await createSeededPostgres();
  t.after(async () => {
    await harness.db.close();
  });

  const clientA = harness.asUser(USER_A, "authenticated");
  const serviceA = createRoutineService(createSupabaseRoutineRepository(clientA));

  // Cria estado inicial legítimo via RPC
  await serviceA.savePreferences({
    userId: USER_A,
    targetDays: 3,
    timezoneIana: "America/Sao_Paulo",
    defaultBudgetMinutes: 15,
  });

  const { session } = await serviceA.startOrResumeSession({
    userId: USER_A,
    topics: makeTopicsFixture(),
    completedContentUnitIds: new Set(),
    idempotencyKey: "pg-sec-start-1",
  });

  const plans = await clientA.from("study_routine_weekly_plans").select("*");
  assert.equal(plans.error, null);
  assert.equal(plans.data.length, 1);
  const planId = plans.data[0].id;
  const activityId = session.activities[0].id;

  // 1. Privilégios: INSERT, UPDATE e DELETE diretos como authenticated são recusados (42501)
  const directInserts = await Promise.all([
    clientA.from("user_study_routine_preferences").insert({
      user_id: USER_A,
      target_days: 7,
      timezone_iana: "UTC",
      default_budget_minutes: 30,
    }),
    clientA.from("study_routine_weekly_plans").insert({
      user_id: USER_A,
      week_start_date: "2020-01-06",
      week_end_date: "2020-01-12",
      target_days: 1,
      timezone_iana: "UTC",
    }),
    clientA.from("study_routine_sessions").insert({
      user_id: USER_A,
      weekly_plan_id: planId,
      status: "completed",
      budget_minutes: 15,
      estimated_minutes: 10,
      selection_mode: "manual",
      idempotency_key: "forged-session",
      completion_idempotency_key: "forged-complete",
      completed_at: "2025-01-01T12:00:00Z",
      completed_local_date: "2025-01-01",
      completed_week_start_date: "2024-12-30",
      completed_timezone_iana: "America/Sao_Paulo",
    }),
    clientA.from("study_routine_session_activities").insert({
      session_id: session.id,
      user_id: USER_A,
      order_index: 9,
      activity_type: "summary",
      status: "completed",
      topic_title: "Forjado",
      discipline: "Forjada",
      activity_title: "Forjado",
      estimated_minutes: 5,
      completed_at: new Date().toISOString(),
    }),
  ]);
  for (const res of directInserts) {
    assert.equal(res.error?.code, "42501");
  }

  const directUpdates = await Promise.all([
    clientA
      .from("user_study_routine_preferences")
      .update({ pending_target_days: null })
      .eq("user_id", USER_A),
    clientA.from("study_routine_weekly_plans").update({ target_days: 1 }).eq("id", planId),
    clientA
      .from("study_routine_sessions")
      .update({ completed_at: "2025-01-01T12:00:00Z" })
      .eq("id", session.id),
    clientA
      .from("study_routine_session_activities")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", activityId),
  ]);
  for (const res of directUpdates) {
    assert.equal(res.error?.code, "42501");
  }

  const directDeletes = await Promise.all([
    clientA.from("user_study_routine_preferences").delete().eq("user_id", USER_A),
    clientA.from("study_routine_weekly_plans").delete().eq("id", planId),
    clientA.from("study_routine_sessions").delete().eq("id", session.id),
    clientA.from("study_routine_session_activities").delete().eq("id", activityId),
  ]);
  for (const res of directDeletes) {
    assert.equal(res.error?.code, "42501");
  }

  // 2. Invariantes de banco: mesmo sem a barreira do GRANT, triggers bloqueiam estados forjados
  //    (simula escrita administrativa/interna fora das regras de histórico)
  await assert.rejects(
    () =>
      harness.db.query(
        `UPDATE public.study_routine_sessions
         SET status = 'completed',
             completion_idempotency_key = 'forged-arbitrary-date',
             completed_at = '2024-06-01T12:00:00Z',
             completed_local_date = '2024-06-01',
             completed_week_start_date = '2024-05-27',
             completed_timezone_iana = 'America/Sao_Paulo'
         WHERE id = $1`,
        [session.id],
      ),
    (err) => err.code === "23514",
  );

  await assert.rejects(
    () =>
      harness.db.query(
        `UPDATE public.study_routine_weekly_plans SET target_days = 1 WHERE id = $1`,
        [planId],
      ),
    (err) => err.code === "55000",
  );

  // Conclui legitimamente via serviço + RPC transacional
  const completed = await serviceA.completeSession({
    userId: USER_A,
    sessionId: session.id,
    completedActivityIds: [activityId],
    completionIdempotencyKey: "pg-sec-complete-1",
    topics: makeTopicsFixture(),
  });
  assert.equal(completed.session.status, "completed");

  // Sessão concluída permanece imutável mesmo em nível de trigger
  await assert.rejects(
    () =>
      harness.db.query(
        `UPDATE public.study_routine_sessions SET status = 'in_progress' WHERE id = $1`,
        [session.id],
      ),
    (err) => err.code === "55000",
  );

  // 3. Exclusão do usuário em auth.users faz cascade limpo sem ser bloqueada pelo trigger
  await harness.db.query(`DELETE FROM auth.users WHERE id = $1`, [USER_A]);
  const leftoverSessions = await harness.db.query(
    `SELECT COUNT(*)::INT AS c FROM public.study_routine_sessions WHERE user_id = $1`,
    [USER_A],
  );
  assert.equal(leftoverSessions.rows[0].c, 0);
});

test("PostgreSQL [P2 #2]: ocultar ou editar orçamento preserva meta e fuso agendados e pré-onboarding não ativa plano", async (t) => {
  const harness = await createSeededPostgres();
  t.after(async () => {
    await harness.db.close();
  });

  const clientA = harness.asUser(USER_A, "authenticated");
  const serviceA = createRoutineService(createSupabaseRoutineRepository(clientA));

  // 1. Ocultar antes do onboarding não grava onboarding_completed_at nem cria plano semanal
  const preHidden = await serviceA.savePreferences({
    userId: USER_A,
    hideGamification: true,
  });
  assert.equal(preHidden.preferences.hide_gamification, true);
  assert.equal(preHidden.preferences.onboarding_completed_at, null);

  const plansBefore = await clientA.from("study_routine_weekly_plans").select("*");
  assert.equal(plansBefore.data.length, 0);

  // 2. Onboarding inicial com meta de 3 dias e fuso America/Sao_Paulo
  await serviceA.savePreferences({
    userId: USER_A,
    targetDays: 3,
    timezoneIana: "America/Sao_Paulo",
    defaultBudgetMinutes: 15,
    hideGamification: false,
  });

  // 3. Agenda troca para 5 dias e Europe/Lisbon
  const scheduled = await serviceA.savePreferences({
    userId: USER_A,
    targetDays: 5,
    timezoneIana: "Europe/Lisbon",
    defaultBudgetMinutes: 15,
    hideGamification: false,
  });
  assert.equal(scheduled.preferences.target_days, 3);
  assert.equal(scheduled.preferences.timezone_iana, "America/Sao_Paulo");
  assert.equal(scheduled.preferences.pending_target_days, 5);
  assert.equal(scheduled.preferences.pending_timezone_iana, "Europe/Lisbon");
  assert.ok(scheduled.preferences.pending_effective_week_start);
  const expectedPendingWeekStart = scheduled.preferences.pending_effective_week_start;

  // 4. Salva apenas hideGamification = true e depois troca apenas orçamento = 30 e reexibe
  const afterHide = await serviceA.savePreferences({
    userId: USER_A,
    hideGamification: true,
  });
  assert.equal(afterHide.preferences.hide_gamification, true);
  assert.equal(afterHide.preferences.pending_target_days, 5);
  assert.equal(afterHide.preferences.pending_timezone_iana, "Europe/Lisbon");
  assert.equal(afterHide.preferences.pending_effective_week_start, expectedPendingWeekStart);

  const afterBudget = await serviceA.savePreferences({
    userId: USER_A,
    defaultBudgetMinutes: 30,
  });
  assert.equal(afterBudget.preferences.default_budget_minutes, 30);
  assert.equal(afterBudget.preferences.hide_gamification, true);
  assert.equal(afterBudget.preferences.pending_target_days, 5);
  assert.equal(afterBudget.preferences.pending_timezone_iana, "Europe/Lisbon");
  assert.equal(afterBudget.preferences.pending_effective_week_start, expectedPendingWeekStart);

  const afterShow = await serviceA.savePreferences({
    userId: USER_A,
    hideGamification: false,
  });
  assert.equal(afterShow.preferences.hide_gamification, false);
  assert.equal(afterShow.preferences.pending_target_days, 5);
  assert.equal(afterShow.preferences.pending_timezone_iana, "Europe/Lisbon");
  assert.equal(afterShow.preferences.pending_effective_week_start, expectedPendingWeekStart);

  // Confirma estado real diretamente na tabela no PostgreSQL
  const pgRowRes = await harness.db.query(
    `SELECT target_days, timezone_iana, default_budget_minutes, hide_gamification,
            pending_target_days, pending_timezone_iana, pending_effective_week_start::TEXT AS pending_week
     FROM public.user_study_routine_preferences
     WHERE user_id = $1`,
    [USER_A],
  );
  assert.equal(pgRowRes.rows[0].pending_target_days, 5);
  assert.equal(pgRowRes.rows[0].pending_timezone_iana, "Europe/Lisbon");
  assert.equal(pgRowRes.rows[0].pending_week, expectedPendingWeekStart);
  assert.equal(pgRowRes.rows[0].default_budget_minutes, 30);
  assert.equal(pgRowRes.rows[0].hide_gamification, false);

  // 5. Promoção na segunda-feira seguinte promove a meta agendada e cria o plano congelado
  const nextWeekWedUtc = `${addCalendarDays(expectedPendingWeekStart, 2)}T15:00:00Z`;
  const promoted = await harness.db.query(
    `SELECT private.sync_user_study_routine_week($1::uuid, true, $2::timestamptz) AS sync`,
    [USER_A, nextWeekWedUtc],
  );
  const syncJson = promoted.rows[0].sync;
  assert.equal(syncJson.preferences.target_days, 5);
  assert.equal(syncJson.preferences.timezone_iana, "Europe/Lisbon");
  assert.equal(syncJson.preferences.pending_target_days, null);
  assert.equal(syncJson.current_plan.target_days, 5);
  assert.equal(syncJson.current_plan.timezone_iana, "Europe/Lisbon");
});

test("PostgreSQL [P2 #3]: criação de sessão é atômica em rollback, rejeita sessão vazia no COMMIT e resiste à concorrência", async (t) => {
  const harness = await createSeededPostgres();
  t.after(async () => {
    await harness.db.close();
  });

  const clientA = harness.asUser(USER_A, "authenticated");
  const serviceOne = createRoutineService(createSupabaseRoutineRepository(clientA));
  const serviceTwo = createRoutineService(createSupabaseRoutineRepository(clientA));

  // 1. Constraint deferida no COMMIT impede criar sessão sem atividades
  await assert.rejects(
    async () => {
      const planRes = await clientA.rpc("ensure_study_routine_weekly_plan", { p_auto_activate: true });
      const planId = planRes.data.current_plan.id;
      await harness.db.exec("BEGIN");
      try {
        await harness.db.query(
          `INSERT INTO public.study_routine_sessions (
             user_id, weekly_plan_id, status, budget_minutes, estimated_minutes,
             selection_mode, idempotency_key
           ) VALUES ($1, $2, 'in_progress', 15, 5, 'manual', 'empty-session-test')`,
          [USER_A, planId],
        );
        await harness.db.exec("COMMIT");
      } catch (err) {
        await harness.db.exec("ROLLBACK");
        throw err;
      }
    },
    (err) => err.code === "23514",
  );

  // Confirma que nenhuma sessão órfã restou
  const afterEmptyAttempt = await harness.db.query(
    `SELECT COUNT(*)::INT AS c FROM public.study_routine_sessions WHERE user_id = $1`,
    [USER_A],
  );
  assert.equal(afterEmptyAttempt.rows[0].c, 0);

  // 2. Cria uma sessão ativa válida primeiro
  const initialStarted = await serviceOne.startOrResumeSession({
    userId: USER_A,
    topics: makeTopicsFixture(),
    completedContentUnitIds: new Set(),
    topicId: "adm-principios",
    idempotencyKey: "pg-valid-first",
  });
  assert.equal(initialStarted.session.status, "in_progress");
  assert.equal(initialStarted.session.activities.length, 1);

  // 3. Falha na 2ª atividade dentro da RPC create_study_routine_session com p_replace_active=true:
  //    a primeira atividade é válida, a segunda aponta para content_unit_id arquivado/inexistente.
  //    PostgreSQL deve reverter tudo (nem descarta a sessão anterior nem cria sessão vazia).
  const failedRpc = await clientA.rpc("create_study_routine_session", {
    p_budget_minutes: 15,
    p_selection_mode: "manual",
    p_idempotency_key: "pg-partial-fail",
    p_replace_active: true,
    p_activities: [
      {
        activity_type: "summary",
        topic_id: "const-art5",
        topic_title: "Direitos Fundamentais",
        discipline: "Direito Constitucional",
        section_id: "const-art5-sec-01",
        content_unit_id: UNIT_CONST_1,
        activity_title: "Caput e igualdade",
        estimated_minutes: 5,
      },
      {
        activity_type: "summary",
        topic_id: "archived-topic",
        topic_title: "Arquivado",
        discipline: "Direito Tributário",
        section_id: "archived-sec-01",
        content_unit_id: UNIT_ARCHIVED,
        activity_title: "Seção Arquivada",
        estimated_minutes: 5,
      },
    ],
  });
  assert.equal(failedRpc.error?.code, "23503");

  // Sessão anterior permanece in_progress (não foi descartada) e nenhuma nova sessão foi criada
  const sessionsAfterFail = await harness.db.query(
    `SELECT id, idempotency_key, status FROM public.study_routine_sessions WHERE user_id = $1`,
    [USER_A],
  );
  assert.equal(sessionsAfterFail.rows.length, 1);
  assert.equal(sessionsAfterFail.rows[0].id, initialStarted.session.id);
  assert.equal(sessionsAfterFail.rows[0].status, "in_progress");

  // Retry válido substituindo a sessão ativa funciona e cria atividades completas
  const retriedReplace = await serviceOne.startOrResumeSession({
    userId: USER_A,
    topics: makeTopicsFixture(),
    completedContentUnitIds: new Set(),
    topicId: "const-art5",
    replaceActive: true,
    idempotencyKey: "pg-partial-retry-ok",
  });
  assert.equal(retriedReplace.session.status, "in_progress");
  assert.equal(retriedReplace.session.activities.length, 2);

  // Conclui sessão atual e testa concorrência com 2 instâncias independentes de createRoutineService
  await serviceOne.completeSession({
    userId: USER_A,
    sessionId: retriedReplace.session.id,
    completedActivityIds: retriedReplace.session.activities.map((a) => a.id),
    completionIdempotencyKey: "pg-complete-before-race",
    topics: makeTopicsFixture(),
  });

  // 4a. Corrida entre duas instâncias independentes com chaves distintas
  const [raceOne, raceTwo] = await Promise.all([
    serviceOne.startOrResumeSession({
      userId: USER_A,
      topics: makeTopicsFixture(),
      completedContentUnitIds: new Set([UNIT_CONST_1, UNIT_CONST_2]),
      topicId: "adm-principios",
      idempotencyKey: "race-independent-1",
    }),
    serviceTwo.startOrResumeSession({
      userId: USER_A,
      topics: makeTopicsFixture(),
      completedContentUnitIds: new Set([UNIT_CONST_1, UNIT_CONST_2]),
      topicId: "adm-principios",
      idempotencyKey: "race-independent-2",
    }),
  ]);

  assert.equal(raceOne.session.id, raceTwo.session.id);
  assert.ok(raceOne.session.activities.length > 0);
  assert.ok(raceTwo.session.activities.length > 0);

  const activeCountRes = await harness.db.query(
    `SELECT COUNT(*)::INT AS c FROM public.study_routine_sessions
     WHERE user_id = $1 AND status IN ('planned', 'in_progress', 'interrupted')`,
    [USER_A],
  );
  assert.equal(activeCountRes.rows[0].c, 1);

  // 4b. Corrida entre duas instâncias independentes com a mesma idempotencyKey após concluir a sessão
  await serviceOne.completeSession({
    userId: USER_A,
    sessionId: raceOne.session.id,
    completedActivityIds: [raceOne.session.activities[0].id],
    completionIdempotencyKey: "race-complete-1",
    topics: makeTopicsFixture(),
  });

  const [sameKeyOne, sameKeyTwo] = await Promise.all([
    serviceOne.startOrResumeSession({
      userId: USER_A,
      topics: makeTopicsFixture(),
      completedContentUnitIds: new Set(),
      topicId: "const-art5",
      idempotencyKey: "race-same-key",
    }),
    serviceTwo.startOrResumeSession({
      userId: USER_A,
      topics: makeTopicsFixture(),
      completedContentUnitIds: new Set(),
      topicId: "const-art5",
      idempotencyKey: "race-same-key",
    }),
  ]);
  assert.equal(sameKeyOne.session.id, sameKeyTwo.session.id);
  assert.equal(sameKeyOne.session.activities.length, 2);
  assert.equal(sameKeyTwo.session.activities.length, 2);

  // 5. Testa update_study_routine_session_status, replace_study_routine_session_activity e complete idempotente
  const paused = await serviceOne.updateSessionStatus({
    userId: USER_A,
    sessionId: sameKeyOne.session.id,
    status: "interrupted",
  });
  assert.equal(paused.status, "interrupted");

  // Arquiva a 1ª seção durante sessão interrompida e substitui via RPC transacional
  await harness.db.query(
    `UPDATE public.sections SET archived_at = now() WHERE content_unit_id = $1`,
    [UNIT_CONST_1],
  );
  const replaced = await serviceOne.replaceUnavailableActivity({
    userId: USER_A,
    sessionId: paused.id,
    activityId: paused.activities[0].id,
    topics: makeTopicsFixture().map((topic) => ({
      ...topic,
      sections: (topic.sections ?? []).filter((s) => s.content_unit_id !== UNIT_CONST_1),
    })),
    completedContentUnitIds: new Set(),
  });
  assert.equal(replaced.activities[0].content_unit_id, UNIT_ADM_1);

  const completedFinal = await serviceOne.completeSession({
    userId: USER_A,
    sessionId: replaced.id,
    completedActivityIds: [replaced.activities[0].id],
    completionIdempotencyKey: "pg-complete-final-idemp",
    topics: makeTopicsFixture(),
  });
  assert.equal(completedFinal.session.status, "completed");

  // Segunda chamada com mesma completionIdempotencyKey é idempotente
  const completedReplay = await serviceOne.completeSession({
    userId: USER_A,
    sessionId: replaced.id,
    completedActivityIds: [replaced.activities[0].id],
    completionIdempotencyKey: "pg-complete-final-idemp",
    topics: makeTopicsFixture(),
  });
  assert.equal(completedReplay.idempotent, true);
  assert.equal(completedReplay.session.id, completedFinal.session.id);

  // Não permite reabrir sessão já concluída
  await assert.rejects(
    () =>
      serviceOne.updateSessionStatus({
        userId: USER_A,
        sessionId: completedFinal.session.id,
        status: "in_progress",
      }),
    (err) => err instanceof RoutineDomainError && err.status === 409,
  );

  // Progresso em user_progress foi sincronizado na conclusão da sessão anterior
  const progressRes = await harness.db.query(
    `SELECT completed FROM public.user_progress WHERE user_id = $1 AND content_unit_id = $2`,
    [USER_A, UNIT_ADM_1],
  );
  assert.equal(progressRes.rows[0]?.completed, true);

  // Não existe content_unit_id inexistente gravado em nenhum registro
  const nonexistentRes = await harness.db.query(
    `SELECT COUNT(*)::INT AS c FROM public.study_routine_session_activities WHERE content_unit_id = $1`,
    [UNIT_NONEXISTENT],
  );
  assert.equal(nonexistentRes.rows[0].c, 0);
});

test("PostgreSQL RLS e RPCs: isolamento entre Usuário A e Usuário B e bloqueio por acesso revogado", async (t) => {
  const harness = await createSeededPostgres();
  t.after(async () => {
    await harness.db.close();
  });

  const clientA = harness.asUser(USER_A, "authenticated");
  const clientB = harness.asUser(USER_B, "authenticated");
  const clientBlocked = harness.asUser(USER_BLOCKED, "authenticated");

  const serviceA = createRoutineService(createSupabaseRoutineRepository(clientA));
  const serviceB = createRoutineService(createSupabaseRoutineRepository(clientB));
  const serviceBlocked = createRoutineService(createSupabaseRoutineRepository(clientBlocked));

  await serviceA.savePreferences({
    userId: USER_A,
    targetDays: 4,
    timezoneIana: "America/Sao_Paulo",
  });
  const startedA = await serviceA.startOrResumeSession({
    userId: USER_A,
    topics: makeTopicsFixture(),
    completedContentUnitIds: new Set(),
    idempotencyKey: "rls-a-1",
  });

  // Usuário B não enxerga preferências, planos, sessões nem atividades do Usuário A via SELECT
  const [prefsB, plansB, sessionsB, activitiesB] = await Promise.all([
    clientB.from("user_study_routine_preferences").select("*").eq("user_id", USER_A),
    clientB.from("study_routine_weekly_plans").select("*").eq("user_id", USER_A),
    clientB.from("study_routine_sessions").select("*").eq("user_id", USER_A),
    clientB.from("study_routine_session_activities").select("*").eq("user_id", USER_A),
  ]);
  assert.equal(prefsB.data.length, 0);
  assert.equal(plansB.data.length, 0);
  assert.equal(sessionsB.data.length, 0);
  assert.equal(activitiesB.data.length, 0);

  // Usuário B não consegue alterar status, substituir atividade ou concluir sessão do Usuário A via RPC
  await assert.rejects(
    () =>
      serviceB.updateSessionStatus({
        userId: USER_B,
        sessionId: startedA.session.id,
        status: "interrupted",
      }),
    (err) => err instanceof RoutineDomainError && err.status === 404,
  );
  await assert.rejects(
    () =>
      serviceB.completeSession({
        userId: USER_B,
        sessionId: startedA.session.id,
        completedActivityIds: [startedA.session.activities[0].id],
        completionIdempotencyKey: "rls-b-forged",
        topics: makeTopicsFixture(),
      }),
    (err) => err instanceof RoutineDomainError && err.status === 404,
  );

  const replaceCrossUser = await clientB.rpc("replace_study_routine_session_activity", {
    p_session_id: startedA.session.id,
    p_activity_id: startedA.session.activities[0].id,
    p_content_unit_id: UNIT_ADM_1,
    p_topic_id: "adm-principios",
    p_topic_title: "Princípios da Administração Pública",
    p_discipline: "Direito Administrativo",
    p_section_id: "adm-principios-sec-01",
    p_activity_title: "LIMPE na prática",
    p_estimated_minutes: 5,
  });
  assert.equal(replaceCrossUser.error?.code, "P0002");

  // Usuário sem acesso ativo recebe 403 / 42501 em todas as operações de escrita RPC
  await assert.rejects(
    () =>
      serviceBlocked.savePreferences({
        userId: USER_BLOCKED,
        targetDays: 3,
        timezoneIana: "America/Sao_Paulo",
      }),
    (err) => err instanceof RoutineDomainError && err.status === 403,
  );
  const blockedEnsure = await clientBlocked.rpc("ensure_study_routine_weekly_plan", {
    p_auto_activate: true,
  });
  assert.equal(blockedEnsure.error?.code, "42501");

  // Anon também é recusado pela RLS/privilégios
  const anonClient = harness.asUser(null, "anon");
  const anonRead = await anonClient.from("study_routine_sessions").select("*");
  assert.equal(anonRead.error?.code, "42501");

  // Confirma cálculo local de semana consistente no teste
  const weekBounds = getWeekBoundsForInstant(new Date(), "America/Sao_Paulo");
  assert.equal(addCalendarDays(weekBounds.weekStartDate, 6), weekBounds.weekEndDate);
});

async function assertWestwardTimezoneTransitionInDb(harness, userOne = USER_A, userTwo = USER_B) {
  // 1. Semana 1 (2026-11-02..2026-11-08): ativa meta 3 em America/Sao_Paulo e grava sessão concluída real
  await harness.db.query(
    `INSERT INTO public.user_study_routine_preferences (
       user_id, target_days, timezone_iana, default_budget_minutes,
       hide_gamification, pending_target_days, pending_timezone_iana,
       pending_effective_week_start, onboarding_completed_at
     ) VALUES (
       $1, 3, 'America/Sao_Paulo', 15, false, 5, 'America/Manaus', '2026-11-09', '2026-11-04T15:00:00Z'
     )`,
    [userOne],
  );
  const w1Insert = await harness.db.query(
    `INSERT INTO public.study_routine_weekly_plans (
       user_id, week_start_date, week_end_date, target_days, timezone_iana, is_partial_first_week
     ) VALUES ($1, '2026-11-02', '2026-11-08', 3, 'America/Sao_Paulo', true)
     RETURNING id`,
    [userOne],
  );
  const w1PlanId = w1Insert.rows[0].id;

  const historicalSession = await harness.withAdminTx(async (tx) => {
    const sessRes = await tx.query(
      `INSERT INTO public.study_routine_sessions (
         user_id, weekly_plan_id, status, budget_minutes, estimated_minutes,
         selection_mode, idempotency_key, started_at, last_activity_at
       ) VALUES (
         $1, $2, 'in_progress', 5, 5,
         'manual', 'west-hist-start', '2026-11-06T14:00:00Z', '2026-11-06T14:00:00Z'
       )
       RETURNING id`,
      [userOne, w1PlanId],
    );
    const sessionId = sessRes.rows[0].id;
    await tx.query(
      `INSERT INTO public.study_routine_session_activities (
         session_id, user_id, order_index, activity_type, status,
         topic_id, topic_title, discipline, section_id, content_unit_id,
         activity_title, estimated_minutes, evidence_kind, completed_at
       ) VALUES (
         $1, $2, 0, 'summary', 'completed',
         'const-art5', 'Direitos Fundamentais', 'Direito Constitucional',
         'const-art5-sec-01', $3, 'Caput e igualdade', 5, 'self_declared', '2026-11-06T14:05:00Z'
       )`,
      [sessionId, userOne, UNIT_CONST_1],
    );
    const completedRes = await tx.query(
      `UPDATE public.study_routine_sessions
       SET status = 'completed',
           completion_idempotency_key = 'west-hist-complete',
           last_activity_at = '2026-11-06T14:05:00Z',
           completed_at = '2026-11-06T14:05:00Z',
           completed_local_date = '2026-11-06',
           completed_week_start_date = '2026-11-02',
           completed_timezone_iana = 'America/Sao_Paulo'
       WHERE id = $1
       RETURNING id, completed_local_date::TEXT AS completed_local_date, completed_timezone_iana`,
      [sessionId],
    );
    return completedRes.rows[0];
  });
  assert.equal(historicalSession.completed_local_date, "2026-11-06");

  // 2. Segunda 2026-11-09 00:30 em São Paulo (03:30 UTC), ainda domingo 23:30 em Manaus:
  //    NÃO deve congelar plano 2026-11-09 com meta 3 / America/Sao_Paulo.
  const atSpMonday = await harness.db.query(
    `SELECT private.sync_user_study_routine_week($1::uuid, true, '2026-11-09T03:30:00Z'::timestamptz) AS sync`,
    [userOne],
  );
  const gapSync = atSpMonday.rows[0].sync;
  assert.equal(gapSync.current_plan.week_start_date, "2026-11-02");
  assert.equal(gapSync.preferences.pending_target_days, 5);
  assert.equal(gapSync.preferences.pending_timezone_iana, "America/Manaus");
  assert.equal(gapSync.preferences.pending_effective_week_start, "2026-11-09");

  const plansDuringGap = await harness.db.query(
    `SELECT week_start_date::TEXT AS week_start_date FROM public.study_routine_weekly_plans WHERE user_id = $1`,
    [userOne],
  );
  assert.deepEqual(
    plansDuringGap.rows.map((r) => r.week_start_date),
    ["2026-11-02"],
  );

  // 3. Segunda 2026-11-09 01:30 em SP / 00:30 em Manaus (04:30 UTC):
  //    Agora ambos os fusos entraram em 2026-11-09 e a meta 5 + America/Manaus entra na própria semana.
  const atManausMonday = await harness.db.query(
    `SELECT private.sync_user_study_routine_week($1::uuid, true, '2026-11-09T04:30:00Z'::timestamptz) AS sync`,
    [userOne],
  );
  const promotedSync = atManausMonday.rows[0].sync;
  assert.equal(promotedSync.current_plan.week_start_date, "2026-11-09");
  assert.equal(promotedSync.current_plan.target_days, 5);
  assert.equal(promotedSync.current_plan.timezone_iana, "America/Manaus");
  assert.equal(promotedSync.preferences.target_days, 5);
  assert.equal(promotedSync.preferences.timezone_iana, "America/Manaus");
  assert.equal(promotedSync.preferences.pending_target_days, null);
  assert.equal(promotedSync.preferences.pending_timezone_iana, null);
  assert.equal(promotedSync.preferences.pending_effective_week_start, null);

  // Histórico da semana anterior e sessão concluída permanecem intactos
  const plansAfter = await harness.db.query(
    `SELECT week_start_date::TEXT AS week_start_date, target_days, timezone_iana
     FROM public.study_routine_weekly_plans
     WHERE user_id = $1
     ORDER BY week_start_date ASC`,
    [userOne],
  );
  assert.deepEqual(
    plansAfter.rows.map((r) => ({
      week_start_date: r.week_start_date,
      target_days: r.target_days,
      timezone_iana: r.timezone_iana,
    })),
    [
      { week_start_date: "2026-11-02", target_days: 3, timezone_iana: "America/Sao_Paulo" },
      { week_start_date: "2026-11-09", target_days: 5, timezone_iana: "America/Manaus" },
    ],
  );

  const histCheck = await harness.db.query(
    `SELECT completed_local_date::TEXT AS completed_local_date, completed_timezone_iana
     FROM public.study_routine_sessions
     WHERE id = $1`,
    [historicalSession.id],
  );
  assert.equal(histCheck.rows[0].completed_local_date, "2026-11-06");
  assert.equal(histCheck.rows[0].completed_timezone_iana, "America/Sao_Paulo");

  // 4. Também valida exatamente as datas da semana 2026-11-09 -> 2026-11-16 em userTwo
  await harness.db.query(
    `INSERT INTO public.user_study_routine_preferences (
       user_id, target_days, timezone_iana, default_budget_minutes,
       hide_gamification, pending_target_days, pending_timezone_iana,
       pending_effective_week_start, onboarding_completed_at
     ) VALUES (
       $1, 3, 'America/Sao_Paulo', 15, false, 5, 'America/Manaus', '2026-11-16', '2026-11-10T12:00:00Z'
     )`,
    [userTwo],
  );
  await harness.db.query(
    `INSERT INTO public.study_routine_weekly_plans (
       user_id, week_start_date, week_end_date, target_days, timezone_iana, is_partial_first_week
     ) VALUES ($1, '2026-11-09', '2026-11-15', 3, 'America/Sao_Paulo', true)`,
    [userTwo],
  );
  const bGap = await harness.db.query(
    `SELECT private.sync_user_study_routine_week($1::uuid, true, '2026-11-16T03:30:00Z'::timestamptz) AS sync`,
    [userTwo],
  );
  assert.equal(bGap.rows[0].sync.current_plan.week_start_date, "2026-11-09");
  assert.equal(bGap.rows[0].sync.preferences.pending_effective_week_start, "2026-11-16");

  const bPromoted = await harness.db.query(
    `SELECT private.sync_user_study_routine_week($1::uuid, true, '2026-11-16T04:30:00Z'::timestamptz) AS sync`,
    [userTwo],
  );
  assert.equal(bPromoted.rows[0].sync.current_plan.week_start_date, "2026-11-16");
  assert.equal(bPromoted.rows[0].sync.current_plan.target_days, 5);
  assert.equal(bPromoted.rows[0].sync.current_plan.timezone_iana, "America/Manaus");
}

test("PostgreSQL [P2 #1]: transição de fuso para oeste (SP -> Manaus) aplica nova meta na segunda sem atrasar 1 semana nem reescrever histórico", async (t) => {
  const harness = await createSeededPostgres();
  t.after(async () => {
    await harness.db.close();
  });

  await assertWestwardTimezoneTransitionInDb(harness);
});

test("PostgreSQL real multi-conexão [P2 #3] & [P2 #1]: contenção real em pg_locks, Promise.all sem fila e transição SP -> Manaus", async (t) => {
  const realPg = await createRealPostgresHarness();
  if (!realPg) {
    t.skip("Binários PostgreSQL (initdb/pg_ctl) ou TEST_DATABASE_URL ausentes neste ambiente.");
    return;
  }

  const { harness, connectionConfig } = realPg;
  const conn1 = new pg.Client(connectionConfig);
  const conn2 = new pg.Client(connectionConfig);
  const observer = new pg.Client(connectionConfig);

  t.after(async () => {
    await Promise.all([
      conn1.end().catch(() => {}),
      conn2.end().catch(() => {}),
      observer.end().catch(() => {}),
    ]);
    await harness.db.close();
  });

  // 1. Prova real de contenção de lock em pg_locks entre 2 conexões TCP simultâneas
  await Promise.all([conn1.connect(), conn2.connect(), observer.connect()]);

  const lockActivities = JSON.stringify([
    {
      activity_type: "summary",
      topic_id: "const-art5",
      topic_title: "Direitos Fundamentais - Artigo 5º",
      discipline: "Direito Constitucional",
      section_id: "const-art5-sec-01",
      content_unit_id: UNIT_CONST_1,
      activity_title: "Caput e igualdade",
      estimated_minutes: 5,
      evidence_kind: "self_declared",
    },
  ]);

  await conn1.query("BEGIN");
  await conn1.query("SET LOCAL ROLE authenticated");
  await conn1.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [USER_A]);
  const conn1Rpc = await conn1.query(
    `SELECT public.create_study_routine_session(
       p_budget_minutes := 15::smallint,
       p_selection_mode := 'manual'::text,
       p_idempotency_key := 'real-lock-conn-1'::text,
       p_activities := $1::jsonb,
       p_replace_active := false
     ) AS result`,
    [lockActivities],
  );
  const conn1SessionId = conn1Rpc.rows[0].result.session.id;

  // Conexão 2 dispara transação simultânea na mesma conta enquanto conn1 segura o advisory lock
  await conn2.query("BEGIN");
  await conn2.query("SET LOCAL ROLE authenticated");
  await conn2.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [USER_A]);
  const conn2Promise = conn2.query(
    `SELECT public.create_study_routine_session(
       p_budget_minutes := 15::smallint,
       p_selection_mode := 'manual'::text,
       p_idempotency_key := 'real-lock-conn-2'::text,
       p_activities := $1::jsonb,
       p_replace_active := false
     ) AS result`,
    [lockActivities],
  );

  // Observa em pg_locks: 1 lock concedido (conn1) e 1 aguardando na fila do PostgreSQL (conn2)
  let observedContention = false;
  for (let attempt = 0; attempt < 150; attempt += 1) {
    const lockRes = await observer.query(
      `SELECT
         COUNT(*) FILTER (WHERE granted)::INT AS granted_locks,
         COUNT(*) FILTER (WHERE NOT granted)::INT AS waiting_locks
       FROM pg_locks
       WHERE locktype = 'advisory'`,
    );
    const { granted_locks: grantedLocks, waiting_locks: waitingLocks } = lockRes.rows[0];
    if (grantedLocks >= 1 && waitingLocks >= 1) {
      observedContention = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 15));
  }
  assert.equal(
    observedContention,
    true,
    "Esperava observar contenção real de advisory lock em pg_locks entre conn1 e conn2.",
  );

  await conn1.query("COMMIT");
  const conn2Rpc = await conn2Promise;
  await conn2.query("COMMIT");

  assert.equal(conn2Rpc.rows[0].result.resumed, true);
  assert.equal(conn2Rpc.rows[0].result.session.id, conn1SessionId);
  assert.equal(conn2Rpc.rows[0].result.session.activities.length, 1);

  // 2. Rajadas concorrentes Promise.all usando PgPoolHarness (pool TCP real sem fila JS)
  const poolServiceOne = createRoutineService(
    createSupabaseRoutineRepository(harness.asUser(USER_A, "authenticated")),
  );
  const poolServiceTwo = createRoutineService(
    createSupabaseRoutineRepository(harness.asUser(USER_A, "authenticated")),
  );

  const [concurrentCompleteOne, concurrentCompleteTwo] = await Promise.all([
    poolServiceOne.completeSession({
      userId: USER_A,
      sessionId: conn1SessionId,
      completedActivityIds: [conn1Rpc.rows[0].result.session.activities[0].id],
      completionIdempotencyKey: "real-pool-complete-1",
      topics: makeTopicsFixture(),
    }),
    poolServiceTwo.completeSession({
      userId: USER_A,
      sessionId: conn1SessionId,
      completedActivityIds: [conn1Rpc.rows[0].result.session.activities[0].id],
      completionIdempotencyKey: "real-pool-complete-2",
      topics: makeTopicsFixture(),
    }),
  ]);
  assert.equal(concurrentCompleteOne.session.id, conn1SessionId);
  assert.equal(concurrentCompleteTwo.session.id, conn1SessionId);
  assert.equal(concurrentCompleteOne.session.status, "completed");
  assert.equal(concurrentCompleteTwo.session.status, "completed");

  const [burstDiffOne, burstDiffTwo] = await Promise.all([
    poolServiceOne.startOrResumeSession({
      userId: USER_A,
      topics: makeTopicsFixture(),
      completedContentUnitIds: new Set([UNIT_CONST_1]),
      topicId: "const-art5",
      idempotencyKey: "real-pool-diff-1",
    }),
    poolServiceTwo.startOrResumeSession({
      userId: USER_A,
      topics: makeTopicsFixture(),
      completedContentUnitIds: new Set([UNIT_CONST_1]),
      topicId: "const-art5",
      idempotencyKey: "real-pool-diff-2",
    }),
  ]);
  assert.equal(burstDiffOne.session.id, burstDiffTwo.session.id);
  assert.ok(burstDiffOne.session.activities.length > 0);
  assert.ok(burstDiffTwo.session.activities.length > 0);

  await poolServiceOne.completeSession({
    userId: USER_A,
    sessionId: burstDiffOne.session.id,
    completedActivityIds: [burstDiffOne.session.activities[0].id],
    completionIdempotencyKey: "real-pool-finish-diff",
    topics: makeTopicsFixture(),
  });

  const [burstSameOne, burstSameTwo] = await Promise.all([
    poolServiceOne.startOrResumeSession({
      userId: USER_A,
      topics: makeTopicsFixture(),
      completedContentUnitIds: new Set(),
      topicId: "adm-principios",
      idempotencyKey: "real-pool-same-key",
    }),
    poolServiceTwo.startOrResumeSession({
      userId: USER_A,
      topics: makeTopicsFixture(),
      completedContentUnitIds: new Set(),
      topicId: "adm-principios",
      idempotencyKey: "real-pool-same-key",
    }),
  ]);
  assert.equal(burstSameOne.session.id, burstSameTwo.session.id);
  assert.equal(burstSameOne.session.activities.length, 1);

  const activeCountRes = await harness.db.query(
    `SELECT COUNT(*)::INT AS c FROM public.study_routine_sessions
     WHERE user_id = $1 AND status IN ('planned', 'in_progress', 'interrupted')`,
    [USER_A],
  );
  assert.equal(activeCountRes.rows[0].c, 1);

  // 3. Semeia dois usuários dedicados e valida também [P2 #1] diretamente no PostgreSQL 18 nativo
  const userWestOne = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
  const userWestTwo = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
  await harness.db.query(
    `INSERT INTO auth.users (id, email) VALUES ($1, $2), ($3, $4)`,
    [userWestOne, "west1@example.com", userWestTwo, "west2@example.com"],
  );
  await harness.db.query(
    `INSERT INTO private.test_entitlements (user_id, active) VALUES ($1, true), ($2, true)`,
    [userWestOne, userWestTwo],
  );
  await assertWestwardTimezoneTransitionInDb(harness, userWestOne, userWestTwo);
});

test("rollback SQL documentado (REVOKE EXECUTE) e restauração (GRANT EXECUTE) preservam tabelas e dados", async () => {
  const docContent = fs.readFileSync(
    path.join(ROOT, "docs", "GAMIFICACAO_IMPLEMENTACAO.md"),
    "utf8",
  );
  const revokeMatch = docContent.match(/```sql\s*(REVOKE EXECUTE ON FUNCTION[\s\S]*?;)\s*```/);
  const grantMatch = docContent.match(/```sql\s*(GRANT EXECUTE ON FUNCTION[\s\S]*?;)\s*```/);

  assert.ok(revokeMatch, "docs/GAMIFICACAO_IMPLEMENTACAO.md deve conter bloco SQL REVOKE EXECUTE");
  assert.ok(grantMatch, "docs/GAMIFICACAO_IMPLEMENTACAO.md deve conter bloco SQL GRANT EXECUTE");

  const revokeSql = revokeMatch[1];
  const grantSql = grantMatch[1];

  assert.ok(
    revokeSql.includes(
      "public.replace_study_routine_session_activity(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, SMALLINT)",
    ),
    "REVOKE deve conter os 9 parâmetros exatos de replace_study_routine_session_activity (5 TEXT)",
  );
  assert.ok(
    grantSql.includes(
      "public.replace_study_routine_session_activity(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, SMALLINT)",
    ),
    "GRANT deve conter os 9 parâmetros exatos de replace_study_routine_session_activity (5 TEXT)",
  );

  const rpcSignatures = [
    "public.ensure_study_routine_weekly_plan(boolean)",
    "public.save_study_routine_preferences(smallint, text, smallint, text, boolean, boolean)",
    "public.create_study_routine_session(smallint, text, text, jsonb, boolean)",
    "public.update_study_routine_session_status(uuid, text)",
    "public.replace_study_routine_session_activity(uuid, uuid, uuid, text, text, text, text, text, smallint)",
    "public.complete_study_routine_session(uuid, uuid[], text, uuid)",
  ];

  const harness = await createSeededPostgres();
  try {
    const clientA = harness.asUser(USER_A, "authenticated");
    const serviceA = createRoutineService(createSupabaseRoutineRepository(clientA), {
      now: () => new Date("2026-11-12T15:00:00.000Z"),
    });

    await serviceA.savePreferences({
      userId: USER_A,
      targetDays: 4,
      timezoneIana: "America/Sao_Paulo",
      defaultBudgetMinutes: 15,
      hideGamification: false,
    });
    const started = await serviceA.startOrResumeSession({
      userId: USER_A,
      topics: makeTopicsFixture(),
      completedContentUnitIds: new Set(),
      budgetMinutes: 15,
      idempotencyKey: "rollback-test-start-1",
    });
    const finished = await serviceA.completeSession({
      userId: USER_A,
      sessionId: started.session.id,
      completedActivityIds: [started.session.activities[0].id],
      completionIdempotencyKey: "rollback-test-complete-1",
      topics: makeTopicsFixture(),
    });

    // Baseline de linhas antes do rollback
    const baseline = await harness.withAdminTx(async (db) => {
      const counts = await db.query(`
        SELECT
          (SELECT COUNT(*)::INT FROM public.user_study_routine_preferences WHERE user_id = $1) AS prefs,
          (SELECT COUNT(*)::INT FROM public.study_routine_weekly_plans WHERE user_id = $1) AS plans,
          (SELECT COUNT(*)::INT FROM public.study_routine_sessions WHERE user_id = $1) AS sessions,
          (SELECT COUNT(*)::INT FROM public.study_routine_session_activities WHERE user_id = $1) AS activities,
          (SELECT COUNT(*)::INT FROM public.user_progress WHERE user_id = $1 AND completed = true) AS progress
      `, [USER_A]);
      return counts.rows[0];
    });
    assert.ok(started.session.activities.length >= 1);
    assert.deepEqual(baseline, {
      prefs: 1,
      plans: 1,
      sessions: 1,
      activities: started.session.activities.length,
      progress: 1,
    });

    // Aplica o bloco exato de REVOKE EXECUTE documentado
    await harness.withAdminTx((db) => db.query(revokeSql));

    for (const sig of rpcSignatures) {
      const privRes = await harness.withAdminTx((db) =>
        db.query("SELECT has_function_privilege('authenticated', $1, 'EXECUTE') AS allowed", [sig]),
      );
      assert.equal(privRes.rows[0].allowed, false, `authenticated deve perder EXECUTE em ${sig}`);
    }

    // Chamadas diretas às 6 RPCs como authenticated devem falhar com 42501
    const blockedCalls = await Promise.all([
      clientA.rpc("ensure_study_routine_weekly_plan", { p_create_if_missing: false }),
      clientA.rpc("save_study_routine_preferences", {
        p_target_days: 5,
        p_timezone_iana: null,
        p_default_budget_minutes: null,
        p_preferred_discipline: null,
        p_clear_preferred_discipline: false,
        p_hide_gamification: null,
      }),
      clientA.rpc("create_study_routine_session", {
        p_budget_minutes: 15,
        p_selection_mode: "recommended",
        p_idempotency_key: "blocked-call",
        p_activities: [],
        p_replace_active: false,
      }),
      clientA.rpc("update_study_routine_session_status", {
        p_session_id: finished.session.id,
        p_status: "interrupted",
      }),
      clientA.rpc("replace_study_routine_session_activity", {
        p_session_id: finished.session.id,
        p_activity_id: started.session.activities[0].id,
        p_content_unit_id: UNIT_CONST_2,
        p_topic_id: "const-art5",
        p_topic_title: "Direitos Fundamentais",
        p_discipline: "Direito Constitucional",
        p_section_id: "const-art5-sec-02",
        p_activity_title: "Substituição",
        p_estimated_minutes: 5,
      }),
      clientA.rpc("complete_study_routine_session", {
        p_session_id: finished.session.id,
        p_completed_activity_ids: [started.session.activities[0].id],
        p_completion_idempotency_key: "blocked-complete",
        p_weekly_plan_id: null,
      }),
    ]);

    for (const [idx, res] of blockedCalls.entries()) {
      assert.equal(
        res.error?.code,
        "42501",
        `RPC #${idx + 1} (${rpcSignatures[idx]}) deve retornar 42501 após REVOKE`,
      );
    }

    // Tabelas e dados existentes permanecem intactos e legíveis via SELECT RLS
    const afterRevoke = await harness.withAdminTx(async (db) => {
      const counts = await db.query(`
        SELECT
          (SELECT COUNT(*)::INT FROM public.user_study_routine_preferences WHERE user_id = $1) AS prefs,
          (SELECT COUNT(*)::INT FROM public.study_routine_weekly_plans WHERE user_id = $1) AS plans,
          (SELECT COUNT(*)::INT FROM public.study_routine_sessions WHERE user_id = $1) AS sessions,
          (SELECT COUNT(*)::INT FROM public.study_routine_session_activities WHERE user_id = $1) AS activities,
          (SELECT COUNT(*)::INT FROM public.user_progress WHERE user_id = $1 AND completed = true) AS progress
      `, [USER_A]);
      return counts.rows[0];
    });
    assert.deepEqual(afterRevoke, baseline);

    const { data: readableSession, error: readSessionError } = await clientA
      .from("study_routine_sessions")
      .select("id, status")
      .eq("id", finished.session.id)
      .single();
    assert.equal(readSessionError, null);
    assert.equal(readableSession?.id, finished.session.id);
    assert.equal(readableSession?.status, "completed");

    // Executa o bloco documentado de restauração GRANT EXECUTE
    await harness.withAdminTx((db) => db.query(grantSql));

    for (const sig of rpcSignatures) {
      const privRes = await harness.withAdminTx((db) =>
        db.query("SELECT has_function_privilege('authenticated', $1, 'EXECUTE') AS allowed", [sig]),
      );
      assert.equal(privRes.rows[0].allowed, true, `authenticated deve recuperar EXECUTE em ${sig}`);
    }

    const restoredSave = await serviceA.savePreferences({
      userId: USER_A,
      hideGamification: true,
    });
    assert.equal(restoredSave.preferences.hide_gamification, true);
  } finally {
    await harness.db.close();
  }
});

test("migration 053 coexiste com 026 e 052 da origin/main sem conflito de objetos ou RLS", async () => {
  const readMainMigration = (relativePath) =>
    execFileSync("git", ["show", `origin/main:${relativePath}`], {
      cwd: ROOT,
      encoding: "utf8",
    });

  const migration026Sql = readMainMigration("supabase/migrations/026_create_study_planner.sql");
  const migration052Sql = readMainMigration("supabase/migrations/052_create_launch_interests.sql");

  const db = new PGlite();
  const harness = new PgliteHarness(db);
  try {
    await db.exec(BOOTSTRAP_SQL);
    await db.exec(migration026Sql);
    await db.exec(migration052Sql);
    await db.exec(MIGRATION_053_SQL);

    await db.query(
      `INSERT INTO auth.users (id, email) VALUES ($1, $2), ($3, $4)`,
      [USER_A, "compat.a@example.com", USER_B, "compat.b@example.com"],
    );
    await db.query(
      `INSERT INTO private.test_entitlements (user_id, active) VALUES ($1, true), ($2, true)`,
      [USER_A, USER_B],
    );
    await db.query(
      `INSERT INTO public.topics (topic_id, discipline, title, sort_order, archived_at) VALUES
        ('const-art5', 'Direito Constitucional', 'Direitos Fundamentais - Artigo 5º', 1, NULL)`,
    );
    await db.query(
      `INSERT INTO public.sections (section_id, topic_id, content_unit_id, title, sort_order, archived_at) VALUES
        ('const-art5-sec-01', 'const-art5', $1, 'Caput e igualdade', 1, NULL)`,
      [UNIT_CONST_1],
    );

    const clientA = harness.asUser(USER_A, "authenticated");
    const clientB = harness.asUser(USER_B, "authenticated");

    // 026 (planner) continua operando para USER_A e isolado de USER_B
    const { data: planInserted, error: plannerErr } = await clientA
      .from("study_plans")
      .insert({
        user_id: USER_A,
        title: "Plano Compatibilidade",
        start_date: "2026-11-09",
      })
      .select()
      .single();
    assert.equal(plannerErr, null);
    assert.equal(planInserted?.title, "Plano Compatibilidade");

    // 053 (gamificação) opera em conjunto via RPCs para USER_A
    const serviceA = createRoutineService(createSupabaseRoutineRepository(clientA), {
      now: () => new Date("2026-11-12T15:00:00.000Z"),
    });
    const topicsCompat = [makeTopicsFixture()[0]];
    await serviceA.savePreferences({
      userId: USER_A,
      targetDays: 3,
      timezoneIana: "America/Sao_Paulo",
      defaultBudgetMinutes: 5,
      hideGamification: false,
    });
    const started = await serviceA.startOrResumeSession({
      userId: USER_A,
      topics: topicsCompat,
      completedContentUnitIds: new Set(),
      budgetMinutes: 5,
      idempotencyKey: "compat-start-1",
    });
    const completed = await serviceA.completeSession({
      userId: USER_A,
      sessionId: started.session.id,
      completedActivityIds: [started.session.activities[0].id],
      completionIdempotencyKey: "compat-done-1",
      topics: topicsCompat,
    });
    assert.equal(completed.session.status, "completed");

    // 052 (launch_interests) mantém bloqueio de SELECT para authenticated
    const launchRead = await clientA.from("launch_interests").select("*");
    assert.equal(launchRead.error?.code, "42501");

    // USER_B não lê registros de USER_A em nenhuma das tabelas
    const bPlans = await clientB.from("study_plans").select("*");
    const bRoutine = await clientB.from("study_routine_sessions").select("*");
    assert.equal(bPlans.error, null);
    assert.equal(bPlans.data?.length ?? 0, 0);
    assert.equal(bRoutine.error, null);
    assert.equal(bRoutine.data?.length ?? 0, 0);
  } finally {
    await harness.db.close();
  }
});
