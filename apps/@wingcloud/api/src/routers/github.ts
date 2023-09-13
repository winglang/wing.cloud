import { createOrUpdateUser } from "../database/user.js";
import { getGitHubLoginFromCode } from "../services/github.js";
import { t } from "../trpc.js";
import * as z from "../validations/index.js";

export const router = t.router({
  "github/authorizeUrl": t.procedure.query(async () => {
    const clientId = process.env["GITHUB_APP_CLIENT_ID"];
    return `https://github.com/login/oauth/authorize?client_id=${clientId}`;
  }),
  "github/callback": t.procedure
    .input(
      z.object({
        code: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { login, tokens } = await getGitHubLoginFromCode(input.code);

      await createOrUpdateUser(
        ctx,
        login,
        tokens.access_token,
        tokens.refresh_token,
      );
      return login;
    }),
});
