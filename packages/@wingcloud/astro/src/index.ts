import type { AstroIntegration } from "astro";

import { dynamodb } from "./dynamodb-integration.js";
import { environmentTypes } from "./environment-types-integration.js";

export default (): AstroIntegration[] => [dynamodb(), environmentTypes()];
