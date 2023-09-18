import { createValidator } from "@wingcloud/type-prefixed-id";

import { projectIdFromString } from "../types/project.js";

export const projectId = createValidator(projectIdFromString);
