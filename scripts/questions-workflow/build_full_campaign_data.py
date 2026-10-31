"""Orquestrador completo da Campanha 30/10/2026.
Gera:
- Fontes canônicas `sources/*_ATUALIZADO.json` (6 provas: CONAB, PMSP, ICMBio, STM, BB, TJSP)
- Lotes técnicos em `batches/lote-*.json`
- Manifesto editorial reconciliado com 520 questões em `editorial-manifest.json`
- Execução dos gates e validações oficiais do importador
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

BASE_DIR = Path(r"C:\PRO\worktrees\questoes-fluxo-20261030")
SCRATCH_DIR = BASE_DIR / "scratch" / "workflow-campanha-20261030"
SOURCES_DIR = SCRATCH_DIR / "sources"
BATCHES_DIR = SCRATCH_DIR / "batches"
GATES_DIR = SCRATCH_DIR / "gates"

for d in [BATCHES_DIR, GATES_DIR, SOURCES_DIR]:
    d.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(BASE_DIR / "scripts" / "questions-workflow"))

from conab_builder import build_conab_questions
from pmsp_builder import build_pmsp_questions
from icmbio_builder import build_icmbio_questions
from stm_builder import build_stm_questions
from bb_builder import build_bb_questions
from tjsp_builder import build_tjsp_questions
from held_builder import build_held_and_duplicate_manifest_records

def stable_stringify(value) -> str:
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False)

def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def main():
    print("=== INICIANDO CONSTRUÇÃO COMPLETA DA CAMPANHA 30/10/2026 (INCLUINDO RETIDAS COM RESSALVA) ===")

    # 1. Carregar catálogo recente
    catalog_path = SCRATCH_DIR / "catalog-fresh.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    disciplines_by_slug = {d["slug"]: d for d in catalog["disciplines"] if d["status"] == "active"}

    # 2. Executar builders das provas
    conab_ready, conab_manifest = build_conab_questions()
    pmsp_ready, pmsp_manifest = build_pmsp_questions()
    icmbio_ready, icmbio_manifest = build_icmbio_questions()
    stm_ready, stm_manifest = build_stm_questions()
    bb_ready, bb_manifest = build_bb_questions()
    tjsp_ready, tjsp_manifest = build_tjsp_questions()
    held_manifest = build_held_and_duplicate_manifest_records()

    total_ready = len(conab_ready) + len(pmsp_ready) + len(icmbio_ready) + len(stm_ready) + len(bb_ready) + len(tjsp_ready)
    all_manifest_records = conab_manifest + pmsp_manifest + icmbio_manifest + stm_manifest + bb_manifest + tjsp_manifest + held_manifest

    print(f"Total de questões prontas para importação: {total_ready}")
    print(f"Total reconciliado no manifesto: {len(all_manifest_records)}")

    # 3. Gerar fontes canônicas *_ATUALIZADO.json
    exam_sources = {
        "conab-2014-assistente-adm_ATUALIZADO.json": conab_ready,
        "pmsp-2024-soldado_ATUALIZADO.json": pmsp_ready,
        "icmbio-2014-analista-adm-especificos_ATUALIZADO.json": icmbio_ready,
        "stm-2011-analista-jud_ATUALIZADO.json": stm_ready,
        "bb-2021-escriturario-agente-comercial_ATUALIZADO.json": bb_ready,
        "tjsp-2021-escrevente-tecnico_ATUALIZADO.json": tjsp_ready,
    }

    source_hashes = {}
    for filename, questions in exam_sources.items():
        out_path = SOURCES_DIR / filename
        data = {"schema_version": "pro-questions/v1", "questions": questions}
        raw_bytes = stable_stringify(data).encode("utf-8")
        out_path.write_bytes(raw_bytes)
        source_hashes[filename] = sha256_bytes(raw_bytes)
        print(f"Fonte gerada: {filename} ({len(questions)} questões, SHA256: {source_hashes[filename][:12]}...)")

    # 4. Gravar editorial-manifest.json
    manifest_doc = {
        "schema_version": "pro-questions/editorial-manifest/v1",
        "questions": all_manifest_records,
    }
    manifest_path = SCRATCH_DIR / "editorial-manifest.json"
    manifest_path.write_text(json.dumps(manifest_doc, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Manifesto editorial gravado com sucesso: {manifest_path} ({len(all_manifest_records)} registros)")

    # 5. Agrupar questões prontas em lotes por prova e disciplina
    exam_groups = [
        ("conab", "conab-2014-assistente-adm_ATUALIZADO.json", conab_ready, False),
        ("pmsp", "pmsp-2024-soldado_ATUALIZADO.json", pmsp_ready, False),
        ("icmbio", "icmbio-2014-analista-adm-especificos_ATUALIZADO.json", icmbio_ready, False),
        ("stm", "stm-2011-analista-jud_ATUALIZADO.json", stm_ready, False),
        ("bb", "bb-2021-escriturario-agente-comercial_ATUALIZADO.json", bb_ready, True),
        ("tjsp", "tjsp-2021-escrevente-tecnico_ATUALIZADO.json", tjsp_ready, True),
    ]

    batch_files = []

    for exam_prefix, src_file, q_list, allow_unverified in exam_groups:
        by_disc = {}
        for q in q_list:
            rec = next(r for r in all_manifest_records if r["external_id"] == q["external_id"])
            disc_slug = rec["taxonomy"]["discipline_slug"]
            if disc_slug not in by_disc:
                by_disc[disc_slug] = []
            by_disc[disc_slug].append(q)

        for disc_slug, items in by_disc.items():
            disc_info = disciplines_by_slug.get(disc_slug)
            if not disc_info:
                raise ValueError(f"Disciplina inativa ou não encontrada: {disc_slug}")

            batch_key = f"{exam_prefix}-{disc_slug}"
            batch_data = {
                "schema_version": "pro-questions/v1",
                "batch_key": batch_key,
                "source": {
                    "file_name": src_file,
                    "sha256": source_hashes[src_file],
                    "metadata": {
                        "generated_at": "2026-10-30T23:30:00Z",
                        "items_count": len(items),
                        "allow_unverified": allow_unverified
                    }
                },
                "discipline": {
                    "slug": disc_slug,
                    "name": disc_info["name"]
                },
                "questions": items
            }

            batch_filename = f"lote-{batch_key}.json"
            batch_path = BATCHES_DIR / batch_filename
            batch_path.write_text(json.dumps(batch_data, indent=2, ensure_ascii=False), encoding="utf-8")
            batch_files.append((batch_path, SOURCES_DIR / src_file, batch_key, allow_unverified))
            print(f"Lote criado: {batch_filename} ({len(items)} questões)")

    print(f"\nTotal de lotes gerados: {len(batch_files)}")

    # 6. Executar o gate em cada lote
    intake_path = SCRATCH_DIR / "intake-consolidated.json"

    print("\n=== EXECUTANDO GATES TÉCNICOS (gate.mjs) ===")
    gate_successes = 0

    for batch_path, source_file, batch_key, allow_unverified in batch_files:
        gate_out = GATES_DIR / f"{batch_key}-gate.json"
        if gate_out.exists():
            gate_out.unlink()
        cmd = [
            "node",
            str(BASE_DIR / "scripts" / "questions-workflow" / "gate.mjs"),
            "--batch", str(batch_path),
            "--catalog", str(catalog_path),
            "--ledger", str(manifest_path),
            "--intake", str(intake_path),
            "--source", str(source_file),
            "--output", str(gate_out),
        ]
        if allow_unverified:
            cmd.append("--allow-unverified")

        res = subprocess.run(cmd, capture_output=True, text=True, cwd=str(BASE_DIR))
        if res.returncode != 0:
            print(f"ERRO no gate do lote {batch_key}:\n{res.stdout}\n{res.stderr}")
        else:
            gate_res = json.loads(gate_out.read_text(encoding="utf-8"))
            if gate_res.get("ok"):
                gate_successes += 1
                print(f"[GATE PASS] {batch_key}: {gate_res.get('questions')} questões aprovadas.")
            else:
                print(f"[GATE FAIL] {batch_key}: falhas {gate_res.get('failures')}")

    print(f"\nGates aprovados: {gate_successes}/{len(batch_files)}")

    # 7. Executar a validação oficial do questions-admin.mjs em cada lote
    print("\n=== EXECUTANDO VALIDAÇÃO OFICIAL (questions-admin.mjs validate) ===")
    admin_successes = 0
    for batch_path, _, batch_key, _ in batch_files:
        cmd = [
            "node",
            str(BASE_DIR / "scripts" / "questions-admin.mjs"),
            "validate",
            "--file", str(batch_path)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, cwd=str(BASE_DIR))
        if res.returncode == 0:
            admin_successes += 1
            print(f"[ADMIN VALIDATE PASS] {batch_key}")
        else:
            print(f"[ADMIN VALIDATE FAIL] {batch_key}:\n{res.stdout}\n{res.stderr}")

    print(f"\nValidações admin aprovadas: {admin_successes}/{len(batch_files)}")

if __name__ == "__main__":
    main()
