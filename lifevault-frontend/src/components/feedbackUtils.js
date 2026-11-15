export function getUserFacingError(error, fallback) {
  const message = error?.response?.data?.message ?? error?.message;
  if (typeof message !== "string" || !message.trim()) return fallback;

  const normalized = message.trim();
  if (
    normalized.length > 240 ||
    /(\bat\b.+:\d+:\d+|\bstack trace\b|\b(?:mongodb|mongoose|axioserror)\b)/i.test(normalized) ||
    /(?:\b(?:authorization|bearer|(?:access|refresh|api)[_-]?token|password|client[_ -]?secret|secret)\s*[:=]\s*\S+|\bbearer\s+\S+)/i.test(normalized) ||
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/.test(normalized)
  ) {
    return fallback;
  }

  return normalized;
}
