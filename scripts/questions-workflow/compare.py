"""Compara extração e comentários por ID, sem tratar toda mudança como erro."""
import argparse
from collections import Counter
import json
from pathlib import Path


def compare(before: Path, after: Path) -> dict:
    result = {"files": [], "questions": 0, "with_explanation": 0}
    for path in sorted(before.glob("*.json")):
        original = json.loads(path.read_text(encoding="utf-8-sig"))
        if not isinstance(original, dict) or "questions" not in original:
            continue
        updated_path = after / path.name
        if not updated_path.exists():
            result["files"].append({"file": path.name, "error": "missing_final_file"})
            continue
        updated = json.loads(updated_path.read_text(encoding="utf-8-sig"))
        old = {question["external_id"]: question for question in original["questions"]}
        new = {question["external_id"]: question for question in updated["questions"]}
        changed = Counter()
        changed_ids = {}
        for identity in sorted(old.keys() & new.keys()):
            fields = sorted(key for key in old[identity].keys() | new[identity].keys() if old[identity].get(key) != new[identity].get(key))
            changed.update(fields)
            if fields:
                changed_ids[identity] = fields
        count = sum(bool(question.get("explanation")) for question in updated["questions"])
        result["files"].append({"file": path.name, "before": len(original["questions"]), "after": len(updated["questions"]),
                                "duplicate_ids_before": len(original["questions"]) - len(old), "duplicate_ids_after": len(updated["questions"]) - len(new),
                                "removed": sorted(old.keys() - new.keys()), "added": sorted(new.keys() - old.keys()),
                                "with_explanation": count, "changed_fields": dict(changed), "changed_ids": changed_ids})
        result["questions"] += len(original["questions"])
        result["with_explanation"] += count
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--before", type=Path, required=True)
    parser.add_argument("--after", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    arguments = parser.parse_args()
    comparison = compare(arguments.before, arguments.after)
    with arguments.output.open("x", encoding="utf-8") as stream:
        json.dump(comparison, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    print(json.dumps({"files": len(comparison["files"]), "questions": comparison["questions"], "with_explanation": comparison["with_explanation"]}))
