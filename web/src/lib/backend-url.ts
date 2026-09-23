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

export const resolveBackendBaseUrl = (): string => {
  const raw = (
    (import.meta.env.VITE_BACKEND_API_URL as string | undefined) ||
    (import.meta.env.VITE_API_URL as string | undefined) ||
    ""
  ).trim();

  const sanitized = stripWrappingQuotes(raw);

  // If empty or relative root/api path:
  if (!sanitized || sanitized === "/" || sanitized === "/api") {
    return "/api";
  }

  // If starts with / (relative path, e.g. /custom-api)
  if (sanitized.startsWith("/")) {
    const clean = sanitized.replace(/\/+$/, "");
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }

  // If already absolute with protocol (https://... or http://...)
  if (/^https?:\/\//i.test(sanitized)) {
    const clean = sanitized.replace(/\/+$/, "");
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }

  // If host without protocol (e.g. classroom-backend.onrender.com):
  // Inherit current page protocol (https in prod) to prevent Mixed Content blocking
  const protocol = typeof window !== "undefined" ? window.location.protocol : "https:";
  const clean = sanitized.replace(/\/+$/, "");
  const withProtocol = `${protocol}//${clean}`;
  return withProtocol.endsWith("/api") ? withProtocol : `${withProtocol}/api`;
};

export const resolveBackendOrigin = (): string => {
  const raw = (
    (import.meta.env.VITE_BACKEND_API_URL as string | undefined) ||
    (import.meta.env.VITE_API_URL as string | undefined) ||
    ""
  ).trim();

  const sanitized = stripWrappingQuotes(raw);

  // If empty or relative path:
  if (!sanitized || sanitized.startsWith("/")) {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "http://localhost:3000";
  }

  // If absolute URL with protocol
  if (/^https?:\/\//i.test(sanitized)) {
    try {
      return new URL(sanitized).origin;
    } catch {
      return sanitized.replace(/\/+$/, "");
    }
  }

  // Host without protocol
  const protocol = typeof window !== "undefined" ? window.location.protocol : "https:";
  try {
    return new URL(`${protocol}//${sanitized}`).origin;
  } catch {
    return `${protocol}//${sanitized.replace(/\/+$/, "")}`;
  }
};

