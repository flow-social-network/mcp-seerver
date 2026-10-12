import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { probeCoreHealth } from "./core-client.js";

export interface HealthSnapshot {
  status: "ok";
  service: "deevo-mcp-server";
  version: "0.1.0";
  runtime: string;
  transport: "stdio";
}

export interface IntegrationSnapshot {
  integration: "noteagents-core";
  status: "not_configured" | "configured_unverified";
  baseUrl: string | null;
  detail: string;
}

/** Reports the local adapter only; Core is checked by a separate live probe. */
export function getHealthSnapshot(): HealthSnapshot {
  return {
    status: "ok",
    service: "deevo-mcp-server",
    version: "0.1.0",
    runtime: process.version,
    transport: "stdio",
  };
}

/** Static configuration summary retained for diagnostics and unit tests. */
export function getIntegrationSnapshot(
  coreUrl = process.env.NOTEAGENTS_CORE_URL?.trim() ?? "",
): IntegrationSnapshot {
  if (!coreUrl) {
    return {
      integration: "noteagents-core",
      status: "not_configured",
      baseUrl: null,
      detail: "NOTEAGENTS_CORE_URL is not set; no Core API calls are available.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(coreUrl);
  } catch {
    return {
      integration: "noteagents-core",
      status: "not_configured",
      baseUrl: null,
      detail: "NOTEAGENTS_CORE_URL is not a valid absolute URL.",
    };
  }

  if (
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname !== "/" && parsed.pathname !== "") ||
    (parsed.protocol !== "https:" &&
      !(parsed.protocol === "http:" &&
        (parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1" ||
          parsed.hostname === "[::1]")))
  ) {
    return {
      integration: "noteagents-core",
      status: "not_configured",
      baseUrl: null,
      detail: "Core URL must be an HTTPS origin (HTTP is allowed only for loopback development) without credentials, query, fragment, or path.",
    };
  }

  return {
    integration: "noteagents-core",
    status: "configured_unverified",
    baseUrl: parsed.origin,
    detail: "URL is configured; use noteagents.integration.status for a live health probe. This still does not verify authentication or authorization.",
  };
}

export function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: "deevo-noteagents-mcp", version: "0.1.0" },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.registerTool(
    "noteagents.health",
    {
      title: "MCP adapter health",
      description:
        "Returns local MCP adapter health only. It does not assert that NoteAgents Core or external dependencies are reachable.",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(getHealthSnapshot(), null, 2) }],
    }),
  );

  server.registerTool(
    "noteagents.integration.status",
    {
      title: "NoteAgents Core live health probe",
      description:
        "Performs a bounded, read-only GET to the configured Core /api/v1/health endpoint. Healthy means only that this endpoint is reachable; it does not prove auth, authorization, database readiness, or business-route safety.",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(await probeCoreHealth(), null, 2) }],
    }),
  );

  return server;
}
