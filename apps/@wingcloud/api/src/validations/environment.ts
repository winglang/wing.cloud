import { createValidator } from "@wingcloud/type-prefixed-id";

import { environmentIdFromString } from "../types/environment.js";

export const environmentId = createValidator(environmentIdFromString);
