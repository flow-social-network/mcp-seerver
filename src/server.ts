import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

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

/**
 * Reports the local adapter's state only. It deliberately does not claim that
 * the Core API is reachable: that requires an authenticated, bounded probe.
 */
export function getHealthSnapshot(): HealthSnapshot {
  return {
    status: "ok",
    service: "deevo-mcp-server",
    version: "0.1.0",
    runtime: process.version,
    transport: "stdio",
  };
}

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

  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    return {
      integration: "noteagents-core",
      status: "not_configured",
      baseUrl: null,
      detail: "Core API URL must use HTTPS except for loopback development URLs.",
    };
  }

  return {
    integration: "noteagents-core",
    status: "configured_unverified",
    baseUrl: parsed.origin,
    detail: "URL is configured but reachability, authentication, and authorization have not been verified.",
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
        "Returns the local MCP adapter health. This does not assert that NoteAgents Core or any external dependency is reachable.",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(getHealthSnapshot(), null, 2) }],
    }),
  );

  server.registerTool(
    "noteagents.integration.status",
    {
      title: "NoteAgents Core integration status",
      description:
        "Reports whether the Core API URL is configured. A configured URL is not proof of connectivity or valid credentials.",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(getIntegrationSnapshot(), null, 2) }],
    }),
  );

  return server;
}
