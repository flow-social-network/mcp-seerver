import { describe, expect, it } from "vitest";
import { getHealthSnapshot, getIntegrationSnapshot } from "../src/server.js";

describe("MCP server health", () => {
  it("reports only the local adapter as healthy", () => {
    const health = getHealthSnapshot();

    expect(health.status).toBe("ok");
    expect(health.service).toBe("deevo-mcp-server");
    expect(health.transport).toBe("stdio");
    expect(health.runtime).toMatch(/^v\d+/);
  });
});

describe("NoteAgents Core integration status", () => {
  it("does not claim connectivity when no URL is configured", () => {
    expect(getIntegrationSnapshot("")).toMatchObject({
      integration: "noteagents-core",
      status: "not_configured",
      baseUrl: null,
    });
  });

  it("does not treat an invalid URL as configured", () => {
    expect(getIntegrationSnapshot("not a url").status).toBe("not_configured");
  });

  it("rejects plain HTTP on non-loopback hosts", () => {
    expect(getIntegrationSnapshot("http://core.internal.example").status).toBe("not_configured");
  });

  it("allows HTTPS configuration but labels it unverified", () => {
    expect(getIntegrationSnapshot("https://core.example.com")).toMatchObject({
      status: "configured_unverified",
      baseUrl: "https://core.example.com",
    });
  });

  it("allows loopback HTTP for local development", () => {
    expect(getIntegrationSnapshot("http://localhost:3000").status).toBe("configured_unverified");
  });
});
