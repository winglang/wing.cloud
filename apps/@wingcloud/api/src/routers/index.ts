import { t } from "../trpc.js";

import { router as user } from "./user.js";

export const router = t.mergeRouters(user);

export type Router = typeof router;
