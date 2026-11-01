"""Gera o lote revisado das 100 questões do TJSP 2021 com manifesto editorial e recibo de auditoria.
Atende rigorosamente aos achados F01, F02, F03, F04, F05 e F09.
"""
from __future__ import annotations

import json
import hashlib
from pathlib import Path
from tjsp_builder import build_tjsp_questions

WORKFLOW_DOCS = Path(__file__).resolve().parents[2] / "docs" / "questoes-workflow"

def main():
    ready_questions, manifest_records = build_tjsp_questions()

    batch_path = WORKFLOW_DOCS / "tjsp_2021_revisado_20261031.json"
    manifest_path = WORKFLOW_DOCS / "tjsp_2021_manifesto_20261031.json"
    receipt_path = WORKFLOW_DOCS / "recibo_tjsp_revisao_20261031.json"

    # 1. Salvar lote de prontas
    batch_json = json.dumps(ready_questions, indent=2, ensure_ascii=False)
    batch_path.write_text(batch_json, encoding="utf-8")
    batch_sha = hashlib.sha256(batch_json.encode("utf-8")).hexdigest()

    # 2. Salvar manifesto completo (100 itens)
    manifest_payload = {
        "schema_version": "pro-questions/editorial-manifest/v1",
        "exam_id": "tjsp-2021-escrevente-tecnico-judiciario",
        "total_items": len(manifest_records),
        "ready_items": len(ready_questions),
        "held_items": len(manifest_records) - len(ready_questions),
        "questions": manifest_records
    }
    manifest_json = json.dumps(manifest_payload, indent=2, ensure_ascii=False)
    manifest_path.write_text(manifest_json, encoding="utf-8")
    manifest_sha = hashlib.sha256(manifest_json.encode("utf-8")).hexdigest()

    # 3. Gerar recibo rastreável
    receipt = {
        "timestamp": "2026-10-31T23:10:00-03:00",
        "action": "tjsp_2021_audit_correction",
        "exam": "TJSP 2021 - Escrevente Técnico Judiciário - Caderno Versão 2",
        "findings_addressed": ["F01", "F02", "F03", "F04", "F05", "F09"],
        "counts": {
            "total_examined": 100,
            "ready_for_publication": len(ready_questions),
            "held_official_cancellation": len(manifest_records) - len(ready_questions),
            "cancelled_items": [30, 78, 87, 97],
            "text_base_recovered": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24],
            "excel_table_recovered": [83],
            "contaminated_option_fixed": [22],
            "taxonomy_reclassified": [47, 48, 50, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
        },
        "artifacts": {
            "batch_file": str(batch_path.name),
            "batch_sha256": batch_sha,
            "manifest_file": str(manifest_path.name),
            "manifest_sha256": manifest_sha,
        }
    }
    receipt_json = json.dumps(receipt, indent=2, ensure_ascii=False)
    receipt_path.write_text(receipt_json, encoding="utf-8")

    print(f"Lote salvo em {batch_path} (SHA: {batch_sha[:16]}...)")
    print(f"Manifesto salvo em {manifest_path} (SHA: {manifest_sha[:16]}...)")
    print(f"Recibo salvo em {receipt_path}")
    print(f"Total: {len(manifest_records)} itens (Prontas: {len(ready_questions)}, Retidas por anulação oficial: {len(manifest_records) - len(ready_questions)})")

if __name__ == "__main__":
    main()
