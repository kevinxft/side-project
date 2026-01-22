export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of tags) {
    const normalized = normalizeTag(raw);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}
