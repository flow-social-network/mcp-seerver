import { describe, expect, it } from "vitest";
import { probeCoreHealth } from "../src/core-client.js";

describe("NoteAgents Core live health probe", () => {
  it("does not make a request when configuration is missing", async () => {
    let called = false;
    const result = await probeCoreHealth("", async () => {
      called = true;
      throw new Error("must not be called");
    });

    expect(called).toBe(false);
    expect(result.status).toBe("not_configured");
  });

  it("rejects non-HTTPS remote URLs and URL injection components", async () => {
    const fetcher = async () => new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    expect((await probeCoreHealth("http://core.example.com", fetcher)).status).toBe("invalid_configuration");
    expect((await probeCoreHealth("https://user:pass@core.example.com", fetcher)).status).toBe("invalid_configuration");
    expect((await probeCoreHealth("https://core.example.com/path", fetcher)).status).toBe("invalid_configuration");
  });

  it("reports healthy only when Core returns HTTP success and status=ok", async () => {
    const fetcher = async (input: string | URL) => {
      expect(String(input)).toBe("https://core.example.com/api/v1/health");
      return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const result = await probeCoreHealth("https://core.example.com", fetcher);
    expect(result).toMatchObject({
      integration: "noteagents-core",
      status: "healthy",
      baseUrl: "https://core.example.com",
    });
    expect(result.latencyMs).not.toBeNull();
    expect(result.detail).toContain("Authentication");
  });

  it("reports unhealthy HTTP responses without leaking response bodies", async () => {
    const result = await probeCoreHealth(
      "https://core.example.com",
      async () => new Response("sensitive internal detail", { status: 503 }),
    );
    expect(result.status).toBe("unhealthy");
    expect(result.detail).toContain("503");
    expect(result.detail).not.toContain("sensitive internal detail");
  });

  it("reports malformed JSON as unhealthy", async () => {
    const result = await probeCoreHealth(
      "https://core.example.com",
      async () => new Response("not-json", { status: 200 }),
    );
    expect(result.status).toBe("unhealthy");
  });

  it("reports timeouts as unreachable", async () => {
    const result = await probeCoreHealth(
      "https://core.example.com",
      (_input, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      }),
      5,
    );
    expect(result.status).toBe("unreachable");
    expect(result.detail).toContain("timed out");
  });
});
