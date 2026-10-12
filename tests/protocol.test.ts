import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMcpServer } from "../src/server.js";

describe("MCP protocol contract", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("initializes a real MCP client session and exposes only implemented tools", async () => {
    vi.stubEnv("NOTEAGENTS_CORE_URL", "");
    const server = createMcpServer();
    const client = new Client({ name: "noteagents-protocol-test", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    try {
      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
      ]);

      const listed = await client.listTools();
      const names = listed.tools.map((tool) => tool.name).sort();
      expect(names).toEqual(["noteagents.health", "noteagents.integration.status"]);

      const health = await client.callTool({ name: "noteagents.health", arguments: {} });
      expect(health.isError).not.toBe(true);
      expect(JSON.parse(String(health.content?.[0]?.text))).toMatchObject({
        status: "ok",
        service: "deevo-mcp-server",
        transport: "stdio",
      });

      const integration = await client.callTool({
        name: "noteagents.integration.status",
        arguments: {},
      });
      expect(integration.isError).not.toBe(true);
      expect(JSON.parse(String(integration.content?.[0]?.text))).toMatchObject({
        integration: "noteagents-core",
        status: "not_configured",
      });
    } finally {
      await client.close();
      await server.close();
    }
  });
});
