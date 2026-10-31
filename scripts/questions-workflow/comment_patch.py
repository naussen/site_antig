"""Prepara SQL transacional de comentários aprovados; não conecta nem grava no banco."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re

from review_comments import digest, load, save


def sql_json(value):
    return "'" + json.dumps(value, ensure_ascii=False).replace("'", "''") + "'::jsonb"


def transaction(items, mode, patch_hash):
    if mode not in ("apply", "dry-run", "rollback") or not items or not re.fullmatch(r"[a-f0-9]{64}", patch_hash):
        raise ValueError("operação vazia ou inválida")
    data = sql_json(items)
    delimiter = "$pro_comment_patch$"
    while delimiter in data:
        delimiter = delimiter[:-1] + "_x$"
    end = "ROLLBACK" if mode == "dry-run" else "COMMIT"
    # Bloqueio de tabela protege também contra inserção concorrente de opções/relações.
    # SHARE ROW EXCLUSIVE é breve: a atualização inteira aborta em qualquer divergência.
    return f"""BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL standard_conforming_strings = on;
LOCK TABLE public.questions, public.question_options, public.question_answer_keys,
  public.question_discipline_relations, public.question_topic_relations, public.question_explanations
  IN SHARE ROW EXCLUSIVE MODE;
DO {delimiter}
DECLARE
  patch jsonb := {data};
  item jsonb;
  qid uuid;
  actual jsonb;
  affected integer;
BEGIN
  IF jsonb_array_length(patch) <> {len(items)} THEN RAISE EXCEPTION 'unexpected patch count'; END IF;
  IF (SELECT count(DISTINCT x->>'id') FROM jsonb_array_elements(patch) x) <> {len(items)} THEN
    RAISE EXCEPTION 'duplicate patch identity';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(patch) LOOP
    qid := (item->>'id')::uuid;
    SELECT to_jsonb(q) INTO actual FROM public.questions q WHERE q.id = qid;
    IF actual IS NULL OR NOT actual @> (item->'question') THEN RAISE EXCEPTION 'question changed: %', qid; END IF;
    SELECT coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'question_id', o.question_id,
      'label', o.label, 'body_markdown', o.body_markdown, 'sort_order', o.sort_order) ORDER BY o.id), '[]'::jsonb)
      INTO actual FROM public.question_options o WHERE o.question_id = qid;
    IF actual IS DISTINCT FROM item->'options' THEN RAISE EXCEPTION 'options changed: %', qid; END IF;
    SELECT jsonb_build_object('question_id', a.question_id, 'correct_option_id', a.correct_option_id)
      INTO actual FROM public.question_answer_keys a WHERE a.question_id = qid;
    IF actual IS DISTINCT FROM item->'answer_key' THEN RAISE EXCEPTION 'answer changed: %', qid; END IF;
    SELECT coalesce(jsonb_agg(jsonb_build_object('question_id', r.question_id, 'discipline_id', r.discipline_id,
      'is_primary', r.is_primary) ORDER BY r.discipline_id), '[]'::jsonb)
      INTO actual FROM public.question_discipline_relations r WHERE r.question_id = qid;
    IF actual IS DISTINCT FROM item->'disciplines' THEN RAISE EXCEPTION 'discipline changed: %', qid; END IF;
    SELECT coalesce(jsonb_agg(jsonb_build_object('question_id', r.question_id, 'topic_id', r.topic_id,
      'relation_type', r.relation_type) ORDER BY r.topic_id), '[]'::jsonb)
      INTO actual FROM public.question_topic_relations r WHERE r.question_id = qid;
    IF actual IS DISTINCT FROM item->'topics' THEN RAISE EXCEPTION 'topic changed: %', qid; END IF;
    SELECT to_jsonb(e) INTO actual FROM public.question_explanations e WHERE e.question_id = qid;
    IF actual IS NULL OR NOT actual @> (item->'expected_explanation') THEN RAISE EXCEPTION 'comment changed: %', qid; END IF;
    UPDATE public.question_explanations SET body_markdown = item->>'replacement' WHERE question_id = qid;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 1 THEN RAISE EXCEPTION 'unexpected update count: %', qid; END IF;
  END LOOP;
END;
{delimiter};
SELECT jsonb_build_object('mode', '{mode}', 'comments', {len(items)}, 'patch_sha256', '{patch_hash}') AS receipt;
{end};
"""


def approved_record(record, item, calls_directory):
    if record.get("verdict") != "correct" or record.get("blockers"):
        return False
    source_text = item["question"]["statement_markdown"] + "\n" + "\n".join(option["body_markdown"] for option in item["options"])
    if re.search(r"[\uf000-\uf8ff]|RASCUNHO|strativo\s*[–—-]\s*Prova", source_text):
        return False
    if record.get("input_sha256") != item["input_sha256"] or record.get("human_review") is not False:
        raise ValueError("identidade da revisão inválida")
    comment = record["proposed_comment"]
    if hashlib.sha256(comment.encode()).hexdigest() != record["proposed_comment_sha256"]:
        raise ValueError("comentário alterado após revisão")
    if comment != record["review"]["final_comment_markdown"] or any(value != "pass" for value in record["review"]["criteria"].values()):
        raise ValueError("parecer não aprova o texto final")
    stages = []
    for call_id in record["calls"]:
        call = load(calls_directory / f"{call_id}.json")
        if call["result_sha256"] != digest(call["result"]):
            raise ValueError("resposta de revisão alterada")
        stages.append(call["stage"])
        if call["stage"] == "confront_review":
            final = next(r for r in call["result"]["items"] if r["id"] == record["external_id"])
            if final != record["review"]:
                raise ValueError("parecer difere da execução")
    if stages != ["draft_blind", "solve_blind", "confront_review"]:
        raise ValueError("etapas independentes ausentes")
    return True


def prepare(snapshot, campaign, output, ids=None):
    if output.exists():
        raise ValueError("diretório de patch existente; use outro nome")
    source = load(snapshot)
    inventory = load(campaign / "inventory.json")
    if digest(source) != inventory["snapshot_sha256"]:
        raise ValueError("snapshot não corresponde à campanha")
    expected = {row["question"]["id"]: row for row in inventory["items"]}
    patch = []
    for path in sorted((campaign / "records").glob("*.json")):
        record = load(path)
        if ids and record["external_id"] not in ids:
            continue
        item = expected[record["id"]]
        if not approved_record(record, item, campaign / "calls"):
            continue
        qid = record["id"]
        patch.append({"id": qid, "external_id": record["external_id"], "question": item["question"],
                      "options": sorted(item["options"], key=lambda r: r["id"]),
                      "answer_key": next(r for r in source["question_answer_keys"] if r["question_id"] == qid),
                      "disciplines": sorted([r for r in source["question_discipline_relations"] if r["question_id"] == qid], key=lambda r: r["discipline_id"]),
                      "topics": sorted([r for r in source["question_topic_relations"] if r["question_id"] == qid], key=lambda r: r["topic_id"]),
                      "expected_explanation": item["explanation"], "replacement": record["proposed_comment"],
                      "review_record_sha256": digest(record)})
    if not patch:
        raise ValueError("nenhuma correção aprovada selecionada")
    patch_hash = digest(patch)
    rollback = []
    for item in patch:
        reverted = dict(item)
        reverted["expected_explanation"] = dict(item["expected_explanation"], body_markdown=item["replacement"])
        reverted["replacement"] = item["expected_explanation"]["body_markdown"]
        rollback.append(reverted)
    save(output / "patch.json", {"schema_version": "pro-questions/comment-patch/v1", "sha256": patch_hash, "items": patch,
                                "authorization": "user_request_autonomous_corrections_2026-10-31", "reviewer_kind": "ai", "human_review": False})
    for mode, items in [("apply", patch), ("dry-run", patch), ("rollback", rollback)]:
        (output / f"{mode}.sql").write_text(transaction(items, mode, patch_hash), encoding="utf-8")
    # Reabre e verifica o backup lógico por ID antes de permitir execução externa.
    assert load(output / "patch.json")["sha256"] == digest(patch)
    print(json.dumps({"prepared_comments": len(patch), "patch_sha256": patch_hash, "database_write": False}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot", required=True, type=Path)
    parser.add_argument("--campaign", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--ids")
    args = parser.parse_args()
    prepare(args.snapshot, args.campaign, args.output, set(args.ids.split(",")) if args.ids else None)
