import assert from "node:assert/strict";
import test from "node:test";

import { getAuthErrorMessage } from "../src/lib/auth-errors.mjs";

test("traduz erros de OAuth e MFA", () => {
  assert.equal(
    getAuthErrorMessage({ code: "oauth_provider_not_supported" }),
    "O provedor Google não está disponível no momento. Tente novamente mais tarde."
  );
  assert.match(
    getAuthErrorMessage({ code: "mfa_challenge_expired" }),
    /TOTP expirou/
  );
});

test("traduz mensagens de limite de envio", () => {
  assert.match(
    getAuthErrorMessage({ message: "Email rate limit exceeded" }),
    /Muitas tentativas/
  );
});

test("preserva uma mensagem desconhecida e mantém fallback seguro", () => {
  assert.equal(
    getAuthErrorMessage({ message: "Falha específica" }),
    "Falha específica"
  );
  assert.equal(
    getAuthErrorMessage(null),
    "Não foi possível concluir a autenticação. Tente novamente."
  );
});
