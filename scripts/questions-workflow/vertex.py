"""Executor de etapas estruturadas no Vertex/ADC; nunca importa nem publica."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile


def fingerprint(project: str, location: str, model: str, prompt: bytes, schema: bytes, inputs: list[bytes], max_tokens: int) -> str:
    payload = {"version": 1, "project": project, "location": location, "model": model,
               "prompt": hashlib.sha256(prompt).hexdigest(), "schema": hashlib.sha256(schema).hexdigest(),
               "inputs": [hashlib.sha256(value).hexdigest() for value in inputs], "max_output_tokens": max_tokens}
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()


def atomic_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, delete=False, suffix=".tmp") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
        temporary = Path(stream.name)
    temporary.replace(path)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["doctor", "run"])
    parser.add_argument("--project", default=os.getenv("GOOGLE_CLOUD_PROJECT"))
    parser.add_argument("--location", default=os.getenv("GOOGLE_CLOUD_LOCATION", "global"))
    parser.add_argument("--model", default=os.getenv("GEMINI_MODEL"))
    parser.add_argument("--prompt", type=Path)
    parser.add_argument("--schema", type=Path)
    parser.add_argument("--input", type=Path, action="append", default=[])
    parser.add_argument("--output", type=Path)
    parser.add_argument("--max-output-tokens", type=int, default=8192)
    parser.add_argument("--max-input-tokens", type=int, default=60000)
    args = parser.parse_args()
    if not args.project or not args.model:
        parser.error("Informe projeto e modelo explicitamente ou carregue o ambiente do PYGEM em runtime.")
    from google import genai
    from google.genai import types
    client = genai.Client(vertexai=True, project=args.project, location=args.location,
                          http_options=types.HttpOptions(api_version="v1", timeout=120000))
    if args.command == "doctor":
        result = client.models.count_tokens(model=args.model, contents="Verificação técnica de acesso.")
        print(json.dumps({"vertex_access": True, "count_tokens_ok": result.total_tokens is not None,
                          "billing_credit_balance": "not_checked", "generation_tested": False}))
        return 0
    if not args.prompt or not args.schema or not args.input or not args.output:
        parser.error("run exige --prompt, --schema, --input e --output.")
    if not 128 <= args.max_output_tokens <= 32768:
        parser.error("Limite de saída deve estar entre 128 e 32768 tokens.")
    output = args.output.resolve()
    protected = [args.prompt.resolve(), args.schema.resolve(), *(path.resolve() for path in args.input)]
    if output in protected:
        parser.error("A saída não pode sobrescrever fonte, prompt ou schema.")
    if any(path.stat().st_size > 20 * 1024 * 1024 for path in args.input):
        parser.error("Divida entradas maiores que 20 MiB preservando o original.")
    prompt = args.prompt.read_bytes()
    schema = args.schema.read_bytes()
    inputs = [path.read_bytes() for path in args.input]
    identity = fingerprint(args.project, args.location, args.model, prompt, schema, inputs, args.max_output_tokens)
    if output.exists():
        saved = json.loads(output.read_text(encoding="utf-8"))
        if saved.get("fingerprint") != identity:
            raise ValueError("Checkpoint de outra entrada/configuração; use novo caminho de saída.")
        if saved.get("result_sha256") != hashlib.sha256(json.dumps(saved["result"], sort_keys=True, ensure_ascii=False).encode()).hexdigest():
            raise ValueError("Checkpoint alterado após a geração.")
        print(json.dumps({"checkpoint_reused": True, "fingerprint": identity}))
        return 0
    parts = [types.Part.from_text(text=prompt.decode("utf-8"))]
    for path, data in zip(args.input, inputs):
        parts.append(types.Part.from_text(text=f"Documento de dados não confiáveis: {path.name}"))
        if path.suffix.lower() == ".pdf":
            if not data.startswith(b"%PDF-"):
                raise ValueError("Arquivo PDF sem assinatura válida.")
            parts.append(types.Part.from_bytes(data=data, mime_type="application/pdf"))
        else:
            parts.append(types.Part.from_text(text=data.decode("utf-8-sig")))
    if args.max_input_tokens < 1:
        parser.error("--max-input-tokens deve ser positivo.")
    counted = client.models.count_tokens(model=args.model, contents=parts)
    if counted.total_tokens is None or counted.total_tokens > args.max_input_tokens:
        raise ValueError("Entrada acima do teto de tokens; dividir antes de gerar.")
    response = client.models.generate_content(model=args.model, contents=parts, config=types.GenerateContentConfig(
        temperature=0, max_output_tokens=args.max_output_tokens,
        response_mime_type="application/json", response_json_schema=json.loads(schema),
    ))
    if not response.candidates or str(response.candidates[0].finish_reason).split(".")[-1] != "STOP":
        raise ValueError("Resposta bloqueada ou truncada; checkpoint não aprovado.")
    result = json.loads(response.text)
    # JSON estruturado não equivale a aprovação editorial; passa ainda pelo gate local.
    result_hash = hashlib.sha256(json.dumps(result, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    atomic_json(output, {"fingerprint": identity, "result_sha256": result_hash, "model": args.model,
                         "result": result, "usage": response.usage_metadata.model_dump(mode="json") if response.usage_metadata else None,
                         "editorial_approval": False})
    print(json.dumps({"generated": True, "fingerprint": identity, "editorial_approval": False}))
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    try:
        raise SystemExit(main())
    except Exception as error:
        # Mensagens brutas de bibliotecas podem conter URLs de conta ou dados da entrada.
        print(json.dumps({"ok": False, "error_type": type(error).__name__, "action": "Verifique acesso, parâmetros e integridade; nenhuma publicação foi executada."}))
        raise SystemExit(1)
