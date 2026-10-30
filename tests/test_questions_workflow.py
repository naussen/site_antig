"""Testes offline: não importam o SDK nem fazem chamadas pagas."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest


def module(name):
    path = Path(__file__).resolve().parents[1] / "scripts" / "questions-workflow" / f"{name}.py"
    specification = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(result)
    return result


class WorkflowTest(unittest.TestCase):
    def test_watermark_does_not_hide_scanned_page(self):
        intake = module("inventory")
        text = "pcimarkpci " + "A" * 200 + "\nwww.pciconcursos.com.br\n   "
        self.assertEqual(intake.meaningful_text(text).strip(), "")
        self.assertIn("Questão 1", intake.meaningful_text(text + "\nQuestão 1"))

    def test_comment_comparison_preserves_id_accounting(self):
        comparison = module("compare")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            before, after = root / "before", root / "after"
            before.mkdir()
            after.mkdir()
            (before / "exam.json").write_text(json.dumps({"questions": [{"external_id": "q1", "explanation": None}]}), encoding="utf-8")
            (after / "exam.json").write_text(json.dumps({"questions": [{"external_id": "q1", "explanation": "Texto"}, {"external_id": "q2", "explanation": "Outra"}]}), encoding="utf-8")
            result = comparison.compare(before, after)
            self.assertEqual(result["files"][0]["added"], ["q2"])
            self.assertEqual(result["files"][0]["changed_fields"], {"explanation": 1})
            self.assertEqual(result["with_explanation"], 2)

    def test_checkpoint_changes_with_all_request_inputs(self):
        vertex = module("vertex")
        arguments = ["project", "global", "model", b"prompt", b"schema", [b"pdf"], 8192]
        initial = vertex.fingerprint(*arguments)
        for index, replacement in enumerate(["other", "us", "new-model", b"new prompt", b"new schema", [b"new pdf"], 4096]):
            changed = arguments.copy()
            changed[index] = replacement
            self.assertNotEqual(initial, vertex.fingerprint(*changed))

    def test_intake_does_not_write_inside_original_directory(self):
        intake = module("inventory")
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory)
            (source / "proof.pdf").write_bytes(b"not a real PDF")
            with self.assertRaises(ValueError):
                intake.inventory(source, source / "output")
            self.assertEqual((source / "proof.pdf").read_bytes(), b"not a real PDF")

    def test_malformed_pdf_is_retained_and_never_overwritten(self):
        intake = module("inventory")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "originals"
            source.mkdir()
            (source / "broken.pdf").write_bytes(b"not a real PDF")
            result = intake.inventory(source, root / "run")
            self.assertIn("error", result["files"][0])
            with self.assertRaises(FileExistsError):
                intake.inventory(source, root / "run")


if __name__ == "__main__":
    unittest.main()
