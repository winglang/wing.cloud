import { cookiesFromRequest } from "@wingcloud/express-cookies";

import { getOrCreateUser } from "../database/user.js";
import { setAuthorizationCookie } from "../services/authorization.js";
import { getGitHubLoginFromCode } from "../services/github.js";
import { t } from "../trpc.js";
import * as z from "../validations/index.js";

export const router = t.router({
  "github/callback": t.procedure
    .input(
      z.object({
        code: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { login, tokens } = await getGitHubLoginFromCode(input.code);

      const userId = await getOrCreateUser(ctx, login);

      const cookies = cookiesFromRequest(ctx.request);

      await setAuthorizationCookie(userId, tokens, cookies);

      return login;
    }),
});
