const REPEATED_TRANSPORT_NOISE = ["-->--->--->>-->", "-->--->>-->"];
const MERMAID_START_PATTERN = /^\s*(?:flowchart|graph)\s+(?:TD|TB|BT|LR|RL)\b|^\s*mindmap\b/iu;
const TIMELINE_NODE_PATTERN = /(\betapa_(\d+)\s*\[")([^"\r\n]*)("\])/gu;

function repairRepeatedTimelineOrdinals(source) {
  return source.replace(
    TIMELINE_NODE_PATTERN,
    (node, opening, rawStepNumber, rawLabel, closing) => {
      const stepNumber = Number.parseInt(rawStepNumber, 10);
      if (!Number.isSafeInteger(stepNumber) || stepNumber < 1) return node;

      const ordinal = String(stepNumber).padStart(2, "0");
      const acceptedOrdinal = ordinal === String(stepNumber)
        ? ordinal
        : `(?:${ordinal}|${stepNumber})`;
      const ordinalPrefix = new RegExp(
        `^${acceptedOrdinal}\\s*(?:<br\\s*\\/?>\\s*)?·\\s*(?:<br\\s*\\/?>\\s*)?`,
        "iu",
      );
      let label = rawLabel;
      let occurrences = 0;

      while (ordinalPrefix.test(label)) {
        label = label.replace(ordinalPrefix, "");
        occurrences += 1;
      }

      if (occurrences < 2 || !label.trim()) return node;
      return `${opening}${ordinal} · ${label.trim()}${closing}`;
    },
  );
}

export function repairMermaidTransportNoise(source) {
  const value = repairRepeatedTimelineOrdinals(String(source ?? ""));
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
