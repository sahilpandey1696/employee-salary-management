import { PrismaClient } from "@prisma/client";
import { createApp } from "./http/app.js";

const prisma = new PrismaClient();
const app = createApp({ prisma });
const port = Number(process.env.PORT ?? 3001);

const server = app.listen(port, () => {
  process.stdout.write(`API listening on http://localhost:${port}\n`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    process.stderr.write(
      `Port ${port} is already in use. Stop the other API process first:\n  lsof -i :${port}\n  kill <PID>\n`,
    );
    process.exit(1);
  }

  throw error;
});
