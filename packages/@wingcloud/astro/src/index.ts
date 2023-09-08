import type { AstroIntegration } from "astro";

import { dotenv } from "./dotenv-integration.js";
import { dynamodb } from "./dynamodb-integration.js";

export default (): AstroIntegration[] => [dynamodb(), dotenv()];
