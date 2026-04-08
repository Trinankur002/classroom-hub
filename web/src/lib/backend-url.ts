const stripWrappingQuotes = (value: string) => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const normalizeWithProtocol = (raw: string) => {
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  return `http://${raw}`;
};

export const resolveBackendBaseUrl = () => {
  const rawValue =
    (import.meta.env.VITE_BACKEND_API_URL as string | undefined) ||
    (import.meta.env.VITE_API_URL as string | undefined) ||
    "http://localhost:3000/api";

  const sanitized = stripWrappingQuotes(rawValue);
  return normalizeWithProtocol(sanitized).replace(/\/+$/, "");
};

export const resolveBackendOrigin = () => {
  const baseUrl = resolveBackendBaseUrl();
  return new URL(baseUrl).origin;
};

