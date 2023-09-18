import { cookiesFromRequest } from "@wingcloud/express-cookies";

import { getOrCreateUser } from "../database/user.js";
import { getLoggedInUserTokens, setAuthCookie } from "../services/auth.js";
import {
  getGitHubLoginFromCode,
  listUserInstallations,
  listInstallationRepos,
} from "../services/github.js";
import { t } from "../trpc.js";
import * as z from "../validations/index.js";

export type GitHubInstallation = {
  id: number;
  name: string;
};

export type GitHubRepo = {
  id: number;
  name: string;
  imgUrl: string;
  private: boolean;
};

export const router = t.router({
  "github.callback": t.procedure
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

  "github.listInstallations": t.procedure.query(async ({ ctx }) => {
    const cookies = cookiesFromRequest(ctx.request);

    const tokens = await getLoggedInUserTokens(cookies);

    if (!tokens) {
      return;
    }

    const installations = await listUserInstallations(tokens.accessToken);
    return installations.map((installation) => ({
      id: installation.id,
      // @ts-ignore-next-line
      name: installation.account?.login,
      iconUrl: installation.account?.avatar_url,
    })) as GitHubInstallation[];
  }),

  "github.listRepos": t.procedure
    .input(
      z.object({
        installationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const cookies = cookiesFromRequest(ctx.request);

      const tokens = await getLoggedInUserTokens(cookies);

      if (!tokens) {
        return;
      }

      const repos = await listInstallationRepos(
        tokens.accessToken,
        Number(input.installationId),
      );
      return repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        imgUrl: repo.owner?.avatar_url,
        private: repo.private,
      })) as GitHubRepo[];
    }),
});
