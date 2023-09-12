import { t } from "../trpc.js";

const routers = await Promise.all([import("./user.js")]);

export const router = t.mergeRouters(...routers.map((m) => m.router));

export type Router = typeof router;
