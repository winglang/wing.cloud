import { createValidator } from "@wingcloud/type-prefixed-id";

import { userIdFromString } from "../types/user.js";

export const userId = createValidator(userIdFromString);
