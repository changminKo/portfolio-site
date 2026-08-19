export type LongTaskRecord = { startTime: number; duration: number };
export type LongTaskSummary = { entries: readonly LongTaskRecord[]; count: number; totalBlockingMs: number };

export function createSyntheticCookieSource(targetBytes = 64 * 1024): string {
  const parts: string[] = [];
  const encoder = new TextEncoder();
  let index = 0;
  while (encoder.encode(parts.join("; ")).byteLength < targetBytes) {
    parts.push(`config_${index}=value_${index.toString(36).padStart(6, "0")}`);
    index += 1;
  }
  return parts.join("; ");
}

export function parseCookieString(source: string): Readonly<Record<string, string>> {
  return Object.fromEntries(source.split(";").map((part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    return [rawKey, rawValue.join("=")];
  }));
}

export function createCachedCookieParser(
  source: string,
  parser: typeof parseCookieString = parseCookieString,
): () => Readonly<Record<string, string>> {
  let cache: Readonly<Record<string, string>> | undefined;
  return () => {
    cache ??= parser(source);
    return cache;
  };
}

export function summarizeLongTasks(entries: readonly LongTaskRecord[], limit = 100): LongTaskSummary {
  const limited = entries.slice(0, limit);
  return {
    entries: limited,
    count: limited.length,
    totalBlockingMs: limited.reduce((sum, task) => sum + task.duration, 0),
  };
}
