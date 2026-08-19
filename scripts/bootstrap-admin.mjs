import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function printUsage() {
  console.log(`Uso:
  node --env-file-if-exists=.env.local scripts/bootstrap-admin.mjs --email administrador@exemplo.com

O comando cria uma conta confirmada com senha temporária ou promove uma conta
existente. A chave SUPABASE_SERVICE_ROLE_KEY permanece somente no processo local.`);
}

function readEmailArgument(args) {
  const emailIndex = args.indexOf("--email");
  const email = emailIndex >= 0 ? args[emailIndex + 1]?.trim().toLowerCase() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Informe um e-mail válido com --email.");
  }

  return email;
}

function requireEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`A variável ${name} não está disponível em .env.local.`);
  }
  return value;
}

async function findUserByEmail(supabase, email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) throw error;

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email
    );
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    return;
  }

  const email = readEmailArgument(args);
  const supabaseUrl = requireEnvironment("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnvironment("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const existingUser = await findUserByEmail(supabase, email);

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      app_metadata: {
        ...existingUser.app_metadata,
        role: "admin",
      },
      email_confirm: true,
    });

    if (error) throw error;

    console.log(
      "Conta existente confirmada e marcada como admin. Use a senha atual para entrar no site."
    );
    return;
  }

  const temporaryPassword = `${randomBytes(24).toString("base64url")}Aa1!`;
  const { error } = await supabase.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    app_metadata: { role: "admin" },
  });

  if (error) throw error;

  console.log("Conta administrativa criada e confirmada.");
  console.log(`Senha temporária (exibida uma única vez): ${temporaryPassword}`);
  console.log("Guarde-a com segurança e não a salve no repositório.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Falha ao preparar a conta administrativa: ${message}`);
  process.exitCode = 1;
});
