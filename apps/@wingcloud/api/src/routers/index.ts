import { t } from "../trpc.js";

import { router as github } from "./github.js";
import { router as user } from "./user.js";

export const router = t.mergeRouters(user, github);

export type Router = typeof router;
