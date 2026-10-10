import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 8787);
createApp()
  .listen(port, () => console.log(`Guardian on http://localhost:${port}  (MCP: /mcp)`))
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") console.error(`Port ${port} is already in use: Guardian is probably already running. Open http://localhost:${port}`);
    else console.error(err);
    process.exit(1);
  });

// A stray rejection should be logged, not take the demo down.
process.on("unhandledRejection", (err) => console.error("[unhandledRejection]", err));
