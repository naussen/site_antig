const TOPIC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_FRAGMENTED_WORD_LENGTH = 4;
const ENCODING_ARTIFACT_PATTERN = /[ÃÂ]|â[\u0080-\u00BF]/;

export function slugifyTopicId(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTopicIdIssue(topicId, topicTitle) {
  const normalizedId = String(topicId ?? "").trim();

  if (!TOPIC_ID_PATTERN.test(normalizedId)) {
    return "topic_id deve usar somente letras minúsculas, números e hífens simples.";
  }

  const canonicalTitleId = slugifyTopicId(topicTitle);
  if (!canonicalTitleId || ENCODING_ARTIFACT_PATTERN.test(String(topicTitle))) {
    return null;
  }

  const idSegments = new Set(normalizedId.split("-"));
  const compactId = normalizedId.replaceAll("-", "");
  const fragmentedWords = canonicalTitleId
    .split("-")
    .filter((word) => (
      word.length >= MIN_FRAGMENTED_WORD_LENGTH
      && compactId.includes(word)
      && !idSegments.has(word)
    ));

  if (fragmentedWords.length > 0) {
    return `topic_id fragmenta palavras do título: ${fragmentedWords.join(", ")}.`;
  }

  return null;
}
