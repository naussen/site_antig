const REPEATED_TRANSPORT_NOISE = ["-->--->--->>-->", "-->--->>-->"];
const MERMAID_START_PATTERN = /^\s*(?:flowchart|graph)\s+(?:TD|TB|BT|LR|RL)\b|^\s*mindmap\b/iu;

export function repairMermaidTransportNoise(source) {
  const value = String(source ?? "");
  const occurrences = REPEATED_TRANSPORT_NOISE.reduce(
    (total, marker) => total + value.split(marker).length - 1,
    0,
  );
  if (occurrences < 8) return value;

  const repaired = REPEATED_TRANSPORT_NOISE.reduce(
    (result, marker) => result.replaceAll(marker, ""),
    value,
  ).trim();
  return MERMAID_START_PATTERN.test(repaired) ? repaired : value;
}
