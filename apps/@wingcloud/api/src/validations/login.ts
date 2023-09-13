import * as z from "zod";

import { gitHubLoginFromString } from "../types/github.js";

export const gitHubLogin = () =>
  z
    .string()
    .min(1)
    .transform((value) => gitHubLoginFromString(value));
