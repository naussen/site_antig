"""Builders antigos não são revisores; nenhuma declaração estática libera publicação."""
from copy import deepcopy
import hashlib
import json


def hold_unreviewed(questions, records):
    """Preserva extração em preparação e retém os itens até revisão real do hash final."""
    questions, records = deepcopy(questions), deepcopy(records)
    indexed = {record["external_id"]: record for record in records}
    for question in questions:
        record = indexed[question["external_id"]]
        record["unreviewed_explanation"] = question["explanation"]
        question["explanation"] = {"body_markdown": "", "source_reference": None}
        question.pop("source_content_hash", None)
        content = json.dumps(question, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        question["source_content_hash"] = hashlib.sha256(content.encode()).hexdigest()
        record["artifact_sha256"] = question["source_content_hash"]
        record["disposition"] = "held"
        record["explanation_author"] = None
        # IDs e frases constantes do builder não são evidência de execução independente.
        record["reviews"] = []
        record["reasons"] = sorted(set(record.get("reasons", []) + ["requires_real_comment_authoring_and_independent_review"]))
    return questions, records
