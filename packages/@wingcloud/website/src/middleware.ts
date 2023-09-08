import { sequence } from "astro:middleware";

import { auth } from "./middlewares/auth.js";
import { redirect } from "./middlewares/redirect.js";

export const onRequest = sequence(auth, redirect);
