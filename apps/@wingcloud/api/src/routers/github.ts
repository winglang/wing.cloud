import { cookiesFromRequest } from "@wingcloud/express-cookies";

import { getOrCreateUser } from "../database/user.js";
import { getLoggedInUserTokens, setAuthCookie } from "../services/auth.js";
import {
  getGitHubLoginFromCode,
  listInstallationRepositories,
  listUserProjects,
} from "../services/github.js";
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

      await setAuthCookie(userId, tokens, cookies);

      return login;
    }),
  "github/list-projects": t.procedure.query(async ({ ctx }) => {
    const cookies = cookiesFromRequest(ctx.request);

    const tokens = await getLoggedInUserTokens(cookies);

    if (!tokens) {
      return;
    }

    const projects = await listInstallationRepositories(tokens?.accessToken);
    return projects.map((project) => ({
      id: project.id,
      name: project.name,
    }));
  }),
});
