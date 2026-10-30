"""Inventário local e imutável de PDFs. Não classifica nem associa por suposição."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import re
from pathlib import Path
import sys


def digest(path: Path) -> str:
    result = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def meaningful_text(text: str) -> str:
    return "\n".join(line for line in text.splitlines()
                     if not re.search(r"pci\s*markpci|www\.pciconcursos\.com\.br", line, re.I))


def inventory(source: Path, destination: Path) -> dict:
    import pdfplumber

    source = source.resolve(strict=True)
    destination = destination.resolve()
    if destination == source or source in destination.parents:
        raise ValueError("A saída deve ficar fora da pasta de PDFs originais.")
    if destination.exists():
        raise FileExistsError("Use um novo diretório de execução; originais e resultados são preservados.")
    files = sorted(source.glob("*.pdf"), key=lambda path: (path.stat().st_mtime_ns, path.name))
    if not files:
        raise ValueError("Nenhum PDF encontrado.")
    destination.mkdir(parents=True)
    manifest = {"schema_version": "pro-questions/intake-v1", "captured_at": datetime.now(timezone.utc).isoformat(), "files": []}
    for order, path in enumerate(files, 1):
        sha = digest(path)
        entry = {"file_name": path.name, "sha256": sha, "bytes": path.stat().st_size,
                 "download_order_hint": order, "pairing_status": "unverified"}
        try:
            with pdfplumber.open(path) as document:
                pages = [page.extract_text(layout=True) or "" for page in document.pages]
            meaningful = [meaningful_text(text) for text in pages]
            entry.update({"pages": len(pages), "characters": sum(map(len, pages)),
                          "meaningful_characters": sum(len(re.sub(r"\s", "", text)) for text in meaningful),
                          "pages_requiring_vision": [number for number, text in enumerate(meaningful, 1)
                                                     if len(re.sub(r"\s", "", text)) < 80 or "\ufffd" in text or "(cid:" in text],
                          "replacement_characters": sum(text.count("\ufffd") for text in pages)})
            text_name = f"{sha}.txt"
            entry["text_file"] = text_name
            text_path = destination / text_name
            if not text_path.exists():
                text_path.write_text("\n\n".join(f"===== PÁGINA {number} =====\n{text}" for number, text in enumerate(pages, 1)), encoding="utf-8")
        except Exception as error:
            entry["error"] = type(error).__name__
        if digest(path) != sha:
            raise ValueError("PDF alterado durante a leitura; execução invalidada.")
        manifest["files"].append(entry)
    (destination / "intake.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    manifest = inventory(args.source, args.output)
    print(json.dumps({"files": len(manifest["files"]), "pages": sum(item.get("pages", 0) for item in manifest["files"]),
                      "errors": sum("error" in item for item in manifest["files"]), "output": str(args.output)}, ensure_ascii=False))
    if any("error" in item for item in manifest["files"]):
        raise SystemExit(1)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
