import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";

async function main(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  // MCP over stdio owns stdout. Do not use console.log for application logs.
  process.on("uncaughtException", (error) => {
    console.error("[deevo-mcp-server] uncaught exception", error);
    process.exitCode = 1;
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[deevo-mcp-server] unhandled rejection", reason);
    process.exitCode = 1;
  });

  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error("[deevo-mcp-server] failed to start", error);
  process.exitCode = 1;
});
