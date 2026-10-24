"""Prepare PDF questions against a read-only snapshot of the site taxonomy.

The original extraction files are never changed. Only unambiguous topic matches
become import batches; everything else remains in the review manifest.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
from io import BytesIO
import json
from pathlib import Path, PureWindowsPath
import re
import unicodedata
from urllib.parse import urlsplit

from PIL import Image


SUBJECT_DISCIPLINES = {
    "administracao": "administracao-geral",
    "administracao de materiais": "administracao-de-recursos-materiais",
    "administracao de recursos materiais": "administracao-de-recursos-materiais",
    "administracao financeira e orcamentaria": "administracao-financeira-e-orcamentaria",
    "administracao geral": "administracao-geral",
    "arquivologia": "arquivologia",
    "contabilidade geral": "contabilidade-geral-e-avancada",
    "direito administrativo": "direito-administrativo",
    "direito constitucional": "direito-constitucional",
    "direito financeiro": "financas-publicas",
    "direito penal": "direito-penal",
    "direito previdenciario": "direito-previdenciario",
    "direito processual penal": "direito-processual-penal",
    "direito tributario": "direito-tributario",
    "estatistica": "raciocinio-logico-matematica-estatistica-e-matematica-financeira",
    "etica": "etica-no-servico-publico",
    "etica e cidadania": "etica-no-servico-publico",
    "etica no setor publico": "etica-no-servico-publico",
    "etica no servico publico": "etica-no-servico-publico",
    "financas publicas": "financas-publicas",
    "gestao de pessoas": "administracao-publica",
    "informatica": "informatica",
    "conhecimentos de informatica": "informatica",
    "nocoes de informatica": "informatica",
    "nocoes de microinformatica": "informatica",
    "lingua portuguesa": "portugues",
    "portugues": "portugues",
    "redacao oficial": "portugues",
    "matematica": "raciocinio-logico-matematica-estatistica-e-matematica-financeira",
    "matematica financeira": "raciocinio-logico-matematica-estatistica-e-matematica-financeira",
    "raciocinio logico": "raciocinio-logico-matematica-estatistica-e-matematica-financeira",
    "raciocinio logico e matematica": "raciocinio-logico-matematica-estatistica-e-matematica-financeira",
    "raciocinio logico matematico": "raciocinio-logico-matematica-estatistica-e-matematica-financeira",
    "nocoes de direito administrativo": "direito-administrativo",
    "nocoes de direito constitucional": "direito-constitucional",
    "nocoes de direito civil": "direito-civil",
    "nocoes de direito eleitoral": "direito-eleitoral",
    "politicas publicas": "administracao-publica",
    "crase": "portugues",
    "concordancia verbal": "portugues",
    "analise sintatica e concordancia": "portugues",
    "funcoes do se": "portugues",
    "conjuncoes e conectivos": "portugues",
    "significacao das palavras": "portugues",
    "reescrita de frases": "portugues",
    "coesao e coerencia": "portugues",
    "compreensao e interpretacao de textos": "portugues",
}

# This map contains only subjects whose scope fits one existing topic.
FIXED_TOPICS = {
    "redacao oficial": "redacao-oficial",
    "crase": "sintaxe",
    "concordancia verbal": "sintaxe",
    "analise sintatica e concordancia": "sintaxe",
    "funcoes do se": "sintaxe",
    "conjuncoes e conectivos": "morfologia",
    "significacao das palavras": "outros-topicos",
    "matematica": "matematica",
    "matematica financeira": "matematica-financeira",
    "estatistica": "estatistica",
    "financas publicas": "financas-publicas",
    "politicas publicas": "politicas-publicas",
    "gestao de pessoas": "gestao-de-pessoas",
}

FIXED_TOPIC_EVIDENCE = {
    "redacao oficial": r"\b(reda[cç][aã]o oficial|textos? oficiais|vocativo|documento|of[ií]cio|requerimento|despacho|pronome de tratamento|comunica[cç][aã]o oficial)\b",
    "matematica financeira": r"\b(juros?|capitaliza[cç][aã]o|investimento|financiamento|taxa efetiva|amortiza[cç][aã]o|parcelas?|presta[cç][aã]o|rentabilidade|valor presente|valor futuro|dep[oó]sito)\b",
    "politicas publicas": r"\b(pol[ií]tica(?:s)? p[uú]blica(?:s)?|pol[ií]ticas implementadas)\b",
}

# Specific terms only. Broad labels deliberately stay in the review queue.
TOPIC_PATTERNS = {
    "raciocinio-logico-matematica-estatistica-e-matematica-financeira": {
        "raciocinio-logico": r"\b(proposi[cç][aã]o|l[oó]gica sentencial|nega[cç][aã]o l[oó]gica|tabela.verdade|argumento l[oó]gico)\b",
    },
    "portugues": {
        "fonetica": r"\b(acentua[cç][aã]o|divis[aã]o sil[aá]bica|s[ií]laba t[oô]nica|h[ií]fen)\b",
        "morfologia": r"\b(pronome|substantivo|adjetivo|adv[eé]rbio|conjun[cç][aã]o|classifica[cç][aã]o morfol[oó]gica|classe de palavras)\b",
        "sintaxe": r"\b(concord[aâ]ncia|reg[eê]ncia|crase|sujeito|predicado|ora[cç][aã]o subordinada|fun[cç][aã]o sint[aá]tica)\b",
        "redacao-oficial": r"\b(reda[cç][aã]o oficial|of[ií]cio|memorando|exposi[cç][aã]o de motivos)\b",
        "outros-topicos": r"\b(significado|sentido do voc[aá]bulo|tipologia textual|denotativo|conotativo)\b",
    },
    "direito-administrativo": {
        "abrangencia-arts-1-e-2": r"\b(lei de acesso [aà] informa[cç][aã]o|lei 12[.]?527|l a i)\b",
        "aplicacao-da-lei-14-133-21": r"\b(lei 14[.]?133|nova lei de licita[cç][oõ]es)\b",
        "classificacao-dos-bens-publicos": r"\b(bens p[uú]blicos|bem p[uú]blico)\b",
        "conceito-e-especies": r"\b(servidor(?:es)? p[uú]blico|agente(?:s)? p[uú]blico|concurso p[uú]blico|cargo(?:s)? p[uú]blico|empregado(?:s)? p[uú]blico)\b",
        "conceitos": r"\b(atributos? do ato administrativo|elementos? do ato administrativo|anula[cç][aã]o de ato|revoga[cç][aã]o de ato|motiva[cç][aã]o do ato|delegar a pr[aá]tica de .*ato administrativo|decretos? n[aã]o s[aã]o considerados atos administrativos)\b",
        "civil": r"\b(responsabilidade civil do estado|responsabilidade civil da administra[cç][aã]o)\b",
        "desconcentracao-administracao-direta-orgaos": r"\b(administra[cç][aã]o direta|administra[cç][aã]o indireta|desconcentra[cç][aã]o|descentraliza[cç][aã]o administrativa|autarquia(?:s)?|funda[cç][aã]o p[uú]blica)\b",
        "improbidade-administrativa": r"\b(improbidade administrativa|lei 8[.]?429)\b",
        "disposicoes-gerais-art-1": r"\b(lei 9[.]?784|processo administrativo federal)\b",
        "criterio-de-servico-publico-doutrinario": r"\b(servi[cç]o(?:s)? p[uú]blico(?:s)?|concess[aã]o de servi[cç]o)\b",
        "deveres": r"\b(poder de pol[ií]cia|poder hier[aá]rquico|poder disciplinar|poder regulamentar)\b",
    },
    "direito-constitucional": {
        "administracao-publica": r"\b(remunera[cç][aã]o|vencimentos|teto remunerat[oó]rio|subs[ií]dio pago aos ministros)\b",
        "direitos-e-garantias-fundamentais": r"\b(direitos? fundamentais|habeas corpus|mandado de seguran[cç]a|direitos? sociais)\b",
        "organizacao-do-estado": r"\b(organiza[cç][aã]o do estado|compet[eê]ncia(?:s)? da uni[aã]o|munic[ií]pios? e estados)\b",
        "poder-legislativo": r"\b(poder legislativo|c[aâ]mara dos deputados|senado federal|congresso nacional)\b",
        "poder-judiciario": r"\b(poder judici[aá]rio|compet[eê]ncia do supremo tribunal federal|compet[eê]ncia do superior tribunal de justi[cç]a)\b",
        "poder-executivo": r"\b(atribui[cç][oõ]es do poder executivo|presidente da rep[uú]blica)\b",
        "controle-de-constitucionalidade": r"\b(controle de constitucionalidade|a[cç][aã]o direta de inconstitucionalidade)\b",
    },
    "direito-previdenciario": {
        "seguridade-social": r"\b(princ[ií]pios? da seguridade|assist[eê]ncia social ser[aá] prestada|benef[ií]cios e servi[cç]os prestados pela seguridade|universalidade da cobertura)\b",
        "regime-geral-de-previdencia-social-rgps": r"\b(regime geral de previd[eê]ncia social|segurados? obrigat[oó]rios?|filia[cç][aã]o ao rgps)\b",
        "plano-de-beneficios-do-rgps": r"\b(sal[aá]rio de benef[ií]cio|aposentadoria por idade|aux[ií]lio.doen[cç]a|sal[aá]rio.fam[ií]lia)\b",
        "salario-de-contribuicao": r"\b(sal[aá]rio de contribui[cç][aã]o)\b",
        "financiamento-da-seguridade-social": r"\b(financiamento da seguridade|custeio da seguridade|contribui[cç][oõ]es? para a seguridade|fonte de receita da seguridade|recursos provenientes da uni[aã]o)\b",
        "lei-de-assistencia-social-loas-lei-8-742-93-e-decreto-6-214-07": r"\b(loas|benef[ií]cio de presta[cç][aã]o continuada|bpc)\b",
    },
    "informatica": {
        "ameacas-virtuais": r"\b(malware|ransomware|v[ií]rus de computador|phishing|cavalo de troia)\b",
        "banco-de-dados": r"\b(banco de dados|sql|sistema gerenciador de banco)\b",
        "computacao-na-nuvem-cloud-computing": r"\b(computa[cç][aã]o em nuvem|cloud computing|saas|paas|iaas)\b",
        "hardware": r"\b(hardware|mem[oó]ria ram|processador|disco r[ií]gido)\b",
        "internet-e-intranet": r"\b(intranet|navegador(?:es)? web|internet explorer|correio eletr[oô]nico|ferramentas? de busca|indexador|s[ií]tios? da internet)\b",
        "redes-de-computadores": r"\b(redes? de computadores|protocolo tcp|endere[cç]o ip|ipv4|roteador|switch(?:es)?|comutador(?:es)?)\b",
        "seguranca-da-informacao": r"\b(seguran[cç]a da informa[cç][aã]o|criptografia|assinatura digital|backup|biometria|autentica[cç][aã]o)\b",
    },
    "arquivologia": {
        "ciclo-vital-arquivistico-teoria-das-tres-idades": r"\b(teoria das tr[eê]s idades|ciclo vital|arquivo corrente.*intermedi[aá]rio)\b",
        "classificacao-dos-documentos-de-arquivo": r"\b(classifica[cç][aã]o dos documentos|documentos s[aã]o classificados)\b",
        "gerenciamento-da-informacao-e-a-gestao-de-documentos": r"\b(gest[aã]o de documentos|tabela de temporalidade)\b",
        "principios-da-arquivologia": r"\b(princ[ií]pio da proveni[eê]ncia|respeito aos fundos)\b",
        "arquivo-corrente": r"\b(arquivo corrente)\b",
        "arquivo-intermediario": r"\b(arquivo intermedi[aá]rio)\b",
        "arquivo-permanente": r"\b(arquivo permanente)\b",
    },
}


def normalized(value: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", value.casefold())
    ascii_text = "".join(char for char in ascii_text if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", ascii_text).strip()


def statement_fingerprint(question: dict) -> str:
    final_paragraph = normalized(question["statement_markdown"].strip().split("\n\n")[-1])
    return final_paragraph if len(final_paragraph) >= 80 else normalized(question["statement_markdown"])


def stable_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def select_topic(question: dict, discipline_slug: str, topic_ids: set[str]) -> tuple[str | None, str]:
    source_subject = normalized(question["subject"])
    fixed = FIXED_TOPICS.get(source_subject)
    if fixed:
        evidence = FIXED_TOPIC_EVIDENCE.get(source_subject)
        final_paragraph = question["statement_markdown"].strip().split("\n\n")[-1]
        if evidence and not re.search(normalized_pattern(evidence), normalized(final_paragraph[-800:])):
            return None, "subject_topic_conflict"
        return (fixed, "fixed_subject") if fixed in topic_ids else (None, "fixed_topic_missing")
    # PDF extraction repeats a shared preamble or source passage. The final
    # paragraph normally contains the actual item being assessed.
    statement = question["statement_markdown"].strip().split("\n\n")[-1]
    text = normalized(statement[-800:])
    matches = [topic for topic, pattern in TOPIC_PATTERNS.get(discipline_slug, {}).items()
               if re.search(normalized_pattern(pattern), text)]
    matches = [topic for topic in matches if topic in topic_ids]
    if len(matches) == 1:
        return matches[0], "specific_statement_term"
    return None, "ambiguous_topic" if matches else "topic_not_identified"


def normalized_pattern(pattern: str) -> str:
    # Patterns are written with accent alternatives for auditability; the input is ASCII.
    return pattern.replace("[aã]", "a").replace("[aá]", "a").replace("[aâ]", "a").replace("[cç]", "c").replace("[eé]", "e").replace("[eê]", "e").replace("[ií]", "i").replace("[oó]", "o").replace("[oô]", "o").replace("[oõ]", "o").replace("[uú]", "u")


def media_reference(question: dict, images_dir: Path) -> tuple[str | None, Path | None, str | None]:
    explanation = question.get("explanation") or ""
    matches = re.findall(r"!\[[^]]*\]\(([^)]+)\)", explanation)
    if not matches:
        return None, None, None
    if len(matches) != 1:
        return None, None, "multiple_images"
    filename = PureWindowsPath(matches[0]).name
    if not re.fullmatch(r"pdf_[a-z0-9_]+\.png", filename, re.I):
        return None, None, "invalid_image_name"
    image_path = images_dir / filename
    if not image_path.is_file():
        return None, None, "missing_or_invalid_image"
    try:
        with Image.open(image_path) as image:
            image.load()
            if image.format != "PNG" or not 1 <= image.width <= 4096 or not 1 <= image.height <= 4096:
                return None, None, "missing_or_invalid_image"
    except (OSError, ValueError):
        return None, None, "missing_or_invalid_image"
    return matches[0], image_path, None


def source_eligibility_reason(question: dict) -> str | None:
    if not question.get("explanation"):
        return "no_reviewed_explanation"
    if (question.get("source_metadata") or {}).get("answer_status") != "definitivo":
        return "answer_not_final"
    return None


def normalize_and_validate_links(markdown: str) -> str:
    markdown = re.sub(r"http://www\.planalto\.gov\.br", "https://www.planalto.gov.br", markdown, flags=re.I)
    for url in re.findall(r"!?\[[^]]*\]\(([^)]+)\)", markdown):
        if url.startswith("/resumos/questions/calculations/"):
            continue
        parsed = urlsplit(url)
        if parsed.scheme != "https" or not (parsed.hostname or "").endswith((".gov.br", ".jus.br", ".leg.br", ".mp.br")):
            raise ValueError("Explicação contém link fora das origens oficiais permitidas.")
    return markdown


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--images-dir", type=Path, required=True)
    parser.add_argument("--public-dir", type=Path, required=True)
    args = parser.parse_args()

    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    disciplines = {item["slug"]: item for item in catalog["disciplines"] if item["status"] == "active"}
    by_discipline = defaultdict(set)
    discipline_ids = {item["id"]: item["slug"] for item in disciplines.values()}
    topics = {item["topic_id"]: item for item in catalog["topics"] if item["archived_at"] is None}
    for relation in catalog["topic_relations"]:
        if relation["topic_id"] in topics and relation["discipline_id"] in discipline_ids:
            by_discipline[discipline_ids[relation["discipline_id"]]].add(relation["topic_id"])

    existing = {statement_fingerprint(item): item["external_id"] for item in catalog["questions"]}
    existing_ids = {item["external_id"] for item in catalog["questions"]}
    prepared = defaultdict(list)
    manifest = []
    media = {}
    source_files = sorted(args.source_dir.glob("*.json"))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    sources = [(source_file, json.loads(source_file.read_text(encoding="utf-8"))) for source_file in source_files]
    fingerprints = Counter(statement_fingerprint(question) for _, source in sources for question in source["questions"])
    for source_file, source in sources:
        if source.get("schema_version") != "pro-questions/extracted-pdf/v1":
            raise ValueError(f"Unexpected source schema: {source_file.name}")
        for question in source["questions"]:
            identifier = question["external_id"]
            statement_key = statement_fingerprint(question)
            reason = None
            discipline_slug = SUBJECT_DISCIPLINES.get(normalized(question["subject"]))
            discipline = disciplines.get(discipline_slug) if discipline_slug else None
            topic_id = None
            classification = None
            answer_status = (question.get("source_metadata") or {}).get("answer_status")
            reason = source_eligibility_reason(question)
            if not reason and (not discipline or not by_discipline[discipline_slug]):
                reason = "discipline_not_in_active_catalog"
            if not reason:
                topic_id, classification = select_topic(question, discipline_slug, by_discipline[discipline_slug])
                if not topic_id:
                    reason = classification
            if not reason and statement_key in existing:
                reason = "already_in_site"
            if not reason and identifier in existing_ids:
                reason = "external_id_already_in_site"
            if not reason and fingerprints[statement_key] > 1:
                reason = "duplicate_source_statement"
            original_image, image_path, image_error = media_reference(question, args.images_dir)
            if not reason and image_error:
                reason = image_error
            if not reason and question["correct_option_label"] not in {item["label"] for item in question["options"]}:
                reason = "invalid_answer"

            record = {
                "external_id": identifier,
                "source_file": source_file.name,
                "source_subject": question["subject"],
                "answer_status": answer_status,
                "discipline_slug": discipline_slug if discipline else None,
                "topic_id": topic_id,
                "classification": classification,
                "duplicate_group_size": fingerprints[statement_key],
                "import_ready": reason is None,
                "reason": reason,
            }
            manifest.append(record)
            if reason:
                continue

            explanation = question["explanation"]
            image_url = None
            if image_path:
                image_url = f"/resumos/questions/calculations/{image_path.name}"
                explanation = explanation.replace(f"({original_image})", f"({image_url})")
                media[image_path.name] = image_path
            explanation = normalize_and_validate_links(explanation)
            source_metadata = question.get("source_metadata") or {}
            review = source_metadata.get("commentary_review") or {}
            metadata = {
                "source_file": source_file.name,
                "source_schema_version": source["schema_version"],
                "source_subject": question["subject"],
                "source_content_hash": question["source_content_hash"],
                "original_numeric_id": source_metadata.get("original_numeric_id"),
                "answer_status": source_metadata.get("answer_status"),
                "commentary_review_status": review.get("status"),
                "outdated_notice": review.get("outdated_notice"),
                "calculation_image_url": image_url,
                "classification": classification,
            }
            item = {key: question.get(key) for key in (
                "external_id", "source_id", "question_type", "statement_markdown", "exam_board",
                "institution", "position_name", "exam_year", "difficulty", "source_reference",
                "options", "correct_option_label",
            )}
            item["subject"] = topics[topic_id]["title"]
            item["source_metadata"] = metadata
            item["topics"] = [{"topic_id": topic_id, "relation_type": "primary", "relevance": 100, "sort_order": 0}]
            item["explanation"] = {"body_markdown": explanation.strip(), "source_reference": None}
            item["source_content_hash"] = digest(stable_json(item).encode("utf-8"))
            prepared[(source_file.name, discipline_slug)].append(item)

    batches_dir = args.output_dir / "batches"
    batches_dir.mkdir(exist_ok=True)
    sources_dir = args.output_dir / "sources"
    sources_dir.mkdir(exist_ok=True)
    for previous_batch in batches_dir.glob("pdf-*.json"):
        previous_batch.unlink()
    for previous_source in sources_dir.glob("*_ATUALIZADO.json"):
        previous_source.unlink()
    selected_ids_by_source = defaultdict(set)
    for (source_name, _), questions in prepared.items():
        selected_ids_by_source[source_name].update(question["external_id"] for question in questions)
    source_snapshots = {}
    for source_name, selected_ids in selected_ids_by_source.items():
        source_file = args.source_dir / source_name
        original_source_hash = digest(source_file.read_bytes())
        original_source = json.loads(source_file.read_text(encoding="utf-8"))
        selected_questions = [question for question in original_source["questions"]
                              if question["external_id"] in selected_ids]
        for original_question in selected_questions:
            review = (original_question.get("source_metadata") or {}).get("commentary_review")
            if isinstance(review, dict):
                review.pop("batch_grounding_urls", None)
        source_copy = {
            "schema_version": "pro-questions/pdf-selected-source/v1",
            "original_file_name": source_name,
            "original_source_sha256": original_source_hash,
            "source": original_source["source"],
            "questions": selected_questions,
        }
        source_bytes = (json.dumps(source_copy, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
        source_alias = f"{source_file.stem}_ATUALIZADO.json"
        (sources_dir / source_alias).write_bytes(source_bytes)
        source_snapshots[source_name] = (source_alias, digest(source_bytes), original_source_hash)
    for (source_name, discipline_slug), questions in sorted(prepared.items()):
        source_file = args.source_dir / source_name
        source_alias, source_hash, original_source_hash = source_snapshots[source_name]
        transformation_hash = digest(stable_json(questions).encode("utf-8"))
        batch_key = f"pdf-{source_file.stem}-{discipline_slug}-{source_hash[:12]}-{transformation_hash[:12]}"
        batch = {
            "schema_version": "pro-questions/v1",
            "batch_key": batch_key,
            "source": {
                "file_name": source_alias,
                "sha256": source_hash,
                "metadata": {
                    "generator": "PDF extraction",
                    "original_file_name": source_name,
                    "original_source_sha256": original_source_hash,
                    "original_schema_version": "pro-questions/extracted-pdf/v1",
                    "prepared_source_schema_version": "pro-questions/pdf-selected-source/v1",
                    "transient_grounding_urls_removed": True,
                    "transformation_sha256": transformation_hash,
                    "classification": "explicit subject and statement terms",
                    "review_status": "reviewed_by_model",
                    "catalog_captured_at": catalog["captured_at"],
                },
            },
            "discipline": {"slug": discipline_slug, "name": disciplines[discipline_slug]["name"]},
            "questions": questions,
        }
        (batches_dir / f"{batch_key}.json").write_text(json.dumps(batch, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    args.public_dir.mkdir(parents=True, exist_ok=True)
    for previous_image in args.public_dir.glob("pdf_*.png"):
        previous_image.unlink()
    for name, path in media.items():
        with Image.open(path) as image:
            image.load()
            clean = image.convert("RGBA" if "A" in image.getbands() else "RGB")
            encoded = BytesIO()
            clean.save(encoded, format="PNG", optimize=True)
            (args.public_dir / name).write_bytes(encoded.getvalue())
    (args.output_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    reasons = Counter(item["reason"] or "ready" for item in manifest)
    summary = {
        "catalog_captured_at": catalog["captured_at"],
        "source_files": len(source_files),
        "source_questions": len(manifest),
        "import_ready": reasons["ready"],
        "batches": len(prepared),
        "copied_sources": len(source_snapshots),
        "copied_images": len(media),
        "image_files": sorted(media),
        "reasons": dict(sorted(reasons.items())),
    }
    (args.output_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
