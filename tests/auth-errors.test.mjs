import assert from "node:assert/strict";
import test from "node:test";

import { getAuthErrorMessage } from "../src/lib/auth-errors.mjs";

test("traduz erros comuns de credenciais e confirmação", () => {
  assert.equal(
    getAuthErrorMessage({ code: "invalid_credentials" }),
    "E-mail ou senha inválidos."
  );
  assert.match(
    getAuthErrorMessage({ code: "email_not_confirmed" }),
    /ainda não foi confirmado/
  );
});

test("traduz mensagens de limite de envio", () => {
  assert.match(
    getAuthErrorMessage({ message: "Email rate limit exceeded" }),
    /limite temporário/
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
