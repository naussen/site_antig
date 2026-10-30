import importlib.util
from pathlib import Path
import tempfile
import unittest

from PIL import Image


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "prepare-pdf-questions.py"
spec = importlib.util.spec_from_file_location("prepare_pdf_questions", SCRIPT)
prepare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)


class PreparePdfQuestionsTests(unittest.TestCase):
    def test_preliminary_or_unrecorded_answer_is_withheld(self):
        question = {"explanation": "Comentário.", "source_metadata": {"answer_status": "preliminar"}}
        self.assertEqual(prepare.source_eligibility_reason(question), "answer_not_final")
        question["source_metadata"]["answer_status"] = None
        self.assertEqual(prepare.source_eligibility_reason(question), "answer_not_final")
        question["source_metadata"]["answer_status"] = "definitivo"
        self.assertIsNone(prepare.source_eligibility_reason(question))

    def test_outdated_item_is_withheld_even_with_final_answer(self):
        question = {
            "explanation": "🔴 **DESATUALIZADO:** norma posterior alterou a resposta.",
            "source_metadata": {"answer_status": "definitivo"},
        }
        self.assertEqual(prepare.source_eligibility_reason(question), "outdated_content")

    def test_exclusions_are_unique_and_bound_to_source(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "excluded.json"
            path.write_text('[{"external_id":"pdf:prova:001","source_file":"prova.json","reason":"outdated_content"}]', encoding="utf-8")
            self.assertEqual(prepare.load_exclusions(path)["pdf:prova:001"]["source_file"], "prova.json")
            path.write_text('[{"external_id":"pdf:prova:001","source_file":"prova.json","reason":"outdated_content"},'
                            '{"external_id":"pdf:prova:001","source_file":"prova.json","reason":"outdated_content"}]', encoding="utf-8")
            with self.assertRaises(ValueError):
                prepare.load_exclusions(path)

    def test_shared_context_does_not_classify_unrelated_item(self):
        question = {
            "subject": "Informática",
            "statement_markdown": (
                "Marta acessou a Internet e a intranet.\n\n"
                "O sistema operacional inclui nativamente o Windows Defender."
            ),
        }
        topic, reason = prepare.select_topic(
            question, "informatica", {"internet-e-intranet", "seguranca-da-informacao"}
        )
        self.assertIsNone(topic)
        self.assertEqual(reason, "topic_not_identified")

    def test_specific_subject_requires_real_topic_relation(self):
        question = {"subject": "Matemática Financeira", "statement_markdown": "Taxa de juros."}
        self.assertEqual(
            prepare.select_topic(question, "matematica-financeira", {"matematica-financeira"})[0],
            "matematica-financeira",
        )
        self.assertEqual(prepare.select_topic(question, "portugues", {"sintaxe"})[1], "fixed_topic_missing")

    def test_quantitative_disciplines_remain_separated(self):
        subject_cases = {
            "matematica": "matematica",
            "matematica financeira": "matematica-financeira",
            "raciocinio logico": "raciocinio-logico",
            "raciocinio logico e matematica": "raciocinio-logico",
            "raciocinio logico matematico": "raciocinio-logico",
            "estatistica": "estatistica",
        }
        for subj, expected_slug in subject_cases.items():
            slug = prepare.SUBJECT_DISCIPLINES.get(subj)
            self.assertEqual(slug, expected_slug, f"Subject '{subj}' deve mapear para '{expected_slug}', obteve '{slug}'")

        # Garante que nenhum subject aponte para o slug composto obsoleto
        obsolete_slug = "raciocinio-logico-matematica-estatistica-e-matematica-financeira"
        for subj, slug in prepare.SUBJECT_DISCIPLINES.items():
            self.assertNotEqual(slug, obsolete_slug, f"Subject '{subj}' não pode mapear para o slug composto obsoleto")

        # Garante que TOPIC_PATTERNS não use mais o slug obsoleto
        self.assertNotIn(obsolete_slug, prepare.TOPIC_PATTERNS)
        self.assertIn("raciocinio-logico", prepare.TOPIC_PATTERNS)

    def test_duplicate_fingerprint_ignores_different_shared_introductions(self):
        item = "A concordância verbal está correta na frase apresentada, considerando as regras da norma padrão da língua portuguesa."
        first = {"statement_markdown": f"Texto inicial A.\n\n{item}"}
        second = {"statement_markdown": f"Texto inicial B.\n\n{item}"}
        self.assertEqual(prepare.statement_fingerprint(first), prepare.statement_fingerprint(second))

    def test_media_requires_known_png_basename_and_decodable_image(self):
        with tempfile.TemporaryDirectory() as directory:
            image = Path(directory) / "pdf_prova_001.png"
            Image.new("RGB", (2, 2)).save(image)
            question = {"explanation": "![Memória](/old/path/pdf_prova_001.png)"}
            self.assertEqual(prepare.media_reference(question, Path(directory))[1], image)
            question["explanation"] = "![Memória](../private.png)"
            self.assertEqual(prepare.media_reference(question, Path(directory))[2], "invalid_image_name")
            image.write_bytes(b"\x89PNG\r\n\x1a\ntruncated")
            question["explanation"] = "![Memória](pdf_prova_001.png)"
            self.assertEqual(prepare.media_reference(question, Path(directory))[2], "missing_or_invalid_image")

    def test_official_http_link_is_upgraded_and_executable_link_is_rejected(self):
        result = prepare.normalize_and_validate_links("[Lei](http://www.planalto.gov.br/lei)")
        self.assertIn("https://www.planalto.gov.br/lei", result)
        with self.assertRaises(ValueError):
            prepare.normalize_and_validate_links("[link](javascript:alert%281%29)")


if __name__ == "__main__":
    unittest.main()
