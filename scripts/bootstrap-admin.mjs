import { createClient } from "@supabase/supabase-js";
import { hasGoogleIdentity } from "../src/lib/auth/google-only.mjs";

function printUsage() {
  console.log(`Uso:
  node --env-file-if-exists=.env.local scripts/bootstrap-admin.mjs --email administrador@exemplo.com

O comando promove uma conta que já tenha entrado pelo Google. Ele não cria conta,
senha ou método alternativo de acesso. A chave SUPABASE_SERVICE_ROLE_KEY permanece
somente no processo local.`);
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

  if (!existingUser) {
    throw new Error(
      "A conta não existe. Entre uma vez pelo Google no site e execute o comando novamente."
    );
  }

  if (!hasGoogleIdentity(existingUser)) {
    throw new Error(
      "A conta existe, mas não possui identidade Google vinculada. Entre pelo Google antes de promovê-la."
    );
  }

  const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
    app_metadata: {
      ...existingUser.app_metadata,
      role: "admin",
    },
  });

  if (error) throw error;

  console.log("Conta Google existente marcada como admin.");
  console.log("Acesse /admin e conclua a validação TOTP/AAL2.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Falha ao preparar a conta administrativa: ${message}`);
  process.exitCode = 1;
});
