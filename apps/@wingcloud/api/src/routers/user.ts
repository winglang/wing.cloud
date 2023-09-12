import { createUser, getUserIdFromLogin } from "../database/user.js";
import { t } from "../trpc.js";
import * as z from "../zod.js";

export const router = t.router({
  getUserIdFromLogin: t.procedure
    .input(
      z.object({
        login: z.gitHubLogin(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = await getUserIdFromLogin(ctx, input.login);

      return {
        login: input.login,
        userId: userId ?? "<unknown>",
      };
    }),
  validateUserId: t.procedure
    .input(
      z.object({
        login: z.gitHubLogin(),
        // userId: z.userId(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = await createUser(ctx, input.login);
      return {
        userId,
      };
    }),
  allUsers: t.procedure.query(async ({ ctx }) => {
    const { Items } = await ctx.dynamodb.scan({
      TableName: ctx.tableName,
    });

    return { Items };
  }),
});
