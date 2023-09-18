import { t } from "../trpc.js";

import { router as environment } from "./environment.js";
import { router as github } from "./github.js";
import { router as project } from "./project.js";
import { router as user } from "./user.js";

export const router = t.mergeRouters(environment, github, project, user);

export type Router = typeof router;
