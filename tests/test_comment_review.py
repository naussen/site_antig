"""Testes offline: aritmética, checkpoint, revisão e SQL; nenhuma chamada ao Vertex."""
import importlib.util
from pathlib import Path
import sys
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts" / "questions-workflow"
sys.path.insert(0, str(SCRIPTS))
import review_comments as review
import comment_patch as patch
from editorial_guard import hold_unreviewed


class ReviewTest(unittest.TestCase):
    def test_known_calculations(self):
        self.assertEqual(review.arithmetic("25000+25000*.02+25000*.002*12"), 26100)
        self.assertEqual(review.arithmetic("sqrt(.25*.75/1875)"), review.Decimal(".01"))
        self.assertEqual(review.arithmetic("comb(4,1)*.25*.75**3"), review.Decimal(".421875"))
        self.assertEqual(review.check_numbers({"requires_calculation": True, "numeric_checks": [{"expression": "10-24*.05-4*.2", "expected": "8", "tolerance": "0"}]}), [])

    def test_no_code_execution_or_unbounded_exponent(self):
        for expression in ["__import__('os').system('anything')", "(1).__class__", "open('file')", "2**99999", "[x for x in range(5)]", "sqrt(1,2)", "True"]:
            with self.subTest(expression=expression), self.assertRaises((ValueError, SyntaxError)):
                review.arithmetic(expression)

    def test_missing_wrong_and_permissive_numbers_fail(self):
        self.assertTrue(review.check_numbers({"requires_calculation": True}))
        self.assertTrue(review.check_numbers({"numeric_checks": [{"expression": "2+2", "expected": "5"}]}))
        self.assertTrue(review.check_numbers({"numeric_checks": [{"expression": "2+2", "expected": "4", "tolerance": "10"}]}))

    def test_ids_cannot_be_lost_or_exchanged(self):
        for rows in [[], [{"id": "a"}, {"id": "a"}], [{"id": "a"}, {"id": "c"}]]:
            with self.assertRaises(ValueError):
                review.validate_ids(rows, ["a", "b"])
        review.validate_ids([{"id": "b"}, {"id": "a"}], ["a", "b"])

    def test_sql_quotes_and_dollar_delimiters_are_data(self):
        sql = patch.transaction([{"id": "test", "replacement": "apostrophe '; DROP TABLE questions; -- $pro_comment_patch$"}], "dry-run", "a" * 64)
        self.assertIn("apostrophe ''; DROP TABLE", sql)
        self.assertIn("DO $pro_comment_patch_x$", sql)
        self.assertTrue(sql.endswith("ROLLBACK;\n"))
        self.assertIn("comment changed", sql)
        self.assertIn("options changed", sql)
        self.assertIn("LOCK TABLE", sql)
        self.assertNotIn("UPDATE public.questions SET", sql)

    def test_sql_rejects_invalid_mode_and_hash(self):
        for mode, sha in [("delete", "a" * 64), ("apply", "';DROP")]:
            with self.assertRaises(ValueError):
                patch.transaction([{}], mode, sha)

    def test_primary_source_allowlist_and_redirect_safety(self):
        self.assertTrue(review.primary_url("https://www.planalto.gov.br/ccivil_03/leis/l8112cons.htm"))
        for url in ["http://www.planalto.gov.br/ccivil", "https://localhost/a", "https://127.0.0.1/a", "https://www.planalto.gov.br.evil.test/a", "https://u:p@www.planalto.gov.br/a", "https://www.planalto.gov.br/"]:
            self.assertFalse(review.primary_url(url))

    def test_https_source_is_not_misclassified_as_local_drive(self):
        self.assertFalse(review.unsafe_comment("[Fonte](https://www.gov.br/investidor/pt-br)"))
        for value in ["C:/PRO/data.png", "C:\\PRO\\file", "[x](javascript:alert(1))", "<script>bad</script>"]:
            self.assertTrue(review.unsafe_comment(value))

    def test_legacy_builders_cannot_manufacture_approval(self):
        questions = [{"external_id": "q1", "explanation": {"body_markdown": "template inadequado", "source_reference": "fonte"}, "source_content_hash": "old"}]
        records = [{"external_id": "q1", "disposition": "ready", "reviews": [{"verdict": "pass", "reviewer": {"id": "fake"}}]}]
        qs, rs = hold_unreviewed(questions, records)
        self.assertEqual(qs[0]["explanation"]["body_markdown"], "")
        self.assertEqual(rs[0]["disposition"], "held")
        self.assertEqual(rs[0]["reviews"], [])
        self.assertNotEqual(qs[0]["source_content_hash"], "old")
        self.assertEqual(questions[0]["source_content_hash"], "old")
        self.assertEqual(rs[0]["unreviewed_explanation"]["body_markdown"], "template inadequado")


if __name__ == "__main__":
    unittest.main()
