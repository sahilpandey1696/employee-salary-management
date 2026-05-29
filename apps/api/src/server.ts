import { PrismaClient } from "@prisma/client";
import { createApp } from "./http/app.js";

const prisma = new PrismaClient();
const app = createApp({ prisma });
const port = Number(process.env.PORT ?? 3001);

app.listen(port);
