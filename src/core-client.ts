export type CoreProbeStatus = "not_configured" | "invalid_configuration" | "unreachable" | "unhealthy" | "healthy";

export interface CoreProbeSnapshot {
  integration: "noteagents-core";
  status: CoreProbeStatus;
  baseUrl: string | null;
  checkedAt: string;
  latencyMs: number | null;
  detail: string;
}

export interface CoreHealthPayload {
  status?: unknown;
  timestamp?: unknown;
}

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

function parseCoreUrl(rawUrl: string): URL | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.username || url.password || url.search || url.hash) return null;
  if (url.protocol !== "https:" && !(url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]"))) {
    return null;
  }
  if (url.pathname !== "/" && url.pathname !== "") return null;
  return url;
}

/**
 * Performs a bounded, read-only probe of the Core health endpoint.
 * This proves reachability only; it does not prove user authentication,
 * authorization, database readiness, or that any business route is safe.
 */
export async function probeCoreHealth(
  rawUrl = process.env.NOTEAGENTS_CORE_URL?.trim() ?? "",
  fetcher: FetchLike = fetch,
  timeoutMs = 3_000,
): Promise<CoreProbeSnapshot> {
  const checkedAt = new Date().toISOString();
  if (!rawUrl) {
    return {
      integration: "noteagents-core",
      status: "not_configured",
      baseUrl: null,
      checkedAt,
      latencyMs: null,
      detail: "NOTEAGENTS_CORE_URL is not set; no Core API request was made.",
    };
  }

  const url = parseCoreUrl(rawUrl);
  if (!url) {
    return {
      integration: "noteagents-core",
      status: "invalid_configuration",
      baseUrl: null,
      checkedAt,
      latencyMs: null,
      detail: "Core URL must be an HTTPS origin (HTTP is allowed only for loopback development) without credentials, query, fragment, or path.",
    };
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(new URL("/api/v1/health", url.origin), {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal,
      redirect: "error",
    });
    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      return {
        integration: "noteagents-core",
        status: "unhealthy",
        baseUrl: url.origin,
        checkedAt,
        latencyMs,
        detail: `Core health endpoint returned HTTP ${response.status}.`,
      };
    }

    let payload: CoreHealthPayload;
    try {
      payload = (await response.json()) as CoreHealthPayload;
    } catch {
      return {
        integration: "noteagents-core",
        status: "unhealthy",
        baseUrl: url.origin,
        checkedAt,
        latencyMs,
        detail: "Core health endpoint returned invalid JSON.",
      };
    }

    if (payload.status !== "ok") {
      return {
        integration: "noteagents-core",
        status: "unhealthy",
        baseUrl: url.origin,
        checkedAt,
        latencyMs,
        detail: "Core health response did not contain status=ok.",
      };
    }

    return {
      integration: "noteagents-core",
      status: "healthy",
      baseUrl: url.origin,
      checkedAt,
      latencyMs,
      detail: "Core health endpoint is reachable and returned status=ok. Authentication, authorization, database readiness, and business routes remain unverified.",
    };
  } catch (error) {
    const timedOut = controller.signal.aborted;
    return {
      integration: "noteagents-core",
      status: "unreachable",
      baseUrl: url.origin,
      checkedAt,
      latencyMs: Date.now() - startedAt,
      detail: timedOut
        ? `Core health probe timed out after ${timeoutMs} ms.`
        : `Core health probe failed: ${error instanceof Error ? error.message : "unknown network error"}.`,
    };
  } finally {
    clearTimeout(timer);
  }
}
