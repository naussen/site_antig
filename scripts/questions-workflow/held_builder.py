"""Construtor dos registros editoriais duplicados para a reconciliação total."""
from __future__ import annotations

def build_held_and_duplicate_manifest_records() -> list[dict]:
    records = []
    
    # ICMBio Conhecimentos Básicos Superior (50 itens duplicados do acervo existente)
    icmbio_basicos_exam_sha = "b79884ec3f49a63e9d7658bb3a0cb4c7dd03d7fc6a7316011bd44fc6949862f3"
    icmbio_basicos_ans_sha = "e8a29d14c454d8c020bbb969a94b4e1f770080b75c8829636afdc4d46dd0e1e6"
    for item in range(1, 51):
        ext_id = f"exam:icmbio-2014-conhec-basicos:item:{item:03d}"
        records.append({
            "external_id": ext_id,
            "artifact_sha256": None,
            "disposition": "duplicate",
            "origin": {
                "exam_id": "icmbio-2014-conhec-basicos-superior",
                "exam_code": "ICMBio14_CBNS01",
                "booklet": "ICMBio14_CBNS01_01",
                "item_number": item,
                "exam_sha256": icmbio_basicos_exam_sha,
                "page": 2 if item <= 25 else 3,
            },
            "answer": {
                "exam_id": "icmbio-2014-conhec-basicos-superior",
                "exam_code": "ICMBio14_CBNS01",
                "booklet": "ICMBio14_CBNS01_01",
                "item_number": item,
                "answer_sha256": icmbio_basicos_ans_sha,
                "page": 2,
                "status": "definitivo",
                "label": None,
                "previous_label": None,
                "change_evidence": None,
            },
            "taxonomy": {
                "concept_key": None,
                "subtopic_key": None,
                "discipline_slug": None,
                "topic_id": None,
            },
            "explanation_author": None,
            "reviews": [],
            "reasons": ["duplicata_identica_de_questoes_ja_presentes_no_acervo"],
        })

    return records
