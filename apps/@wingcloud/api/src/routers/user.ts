import { unmarshall } from "@aws-sdk/util-dynamodb";
import { cookiesFromRequest } from "@wingcloud/express-cookies";

import { listUserProjects, getProject } from "../database/project.js";
import { createUser, getUserIdFromLogin } from "../database/user.js";
import { getLoggedInUserId } from "../services/auth.js";
import { t } from "../trpc.js";
import { createProjectId, projectIdFromString } from "../types/project.js";
import * as z from "../validations/index.js";

export const router = t.router({
  self: t.procedure.query(async ({ ctx }) => {
    return {
      userId: ctx.userId,
    };
  }),
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
      // FilterExpression: "begins_with(pk, :pk)",
      // ExpressionAttributeValues: {
      //   ":pk": {
      //     S: "login#",
      //   },
      // },
    });

    // return { Items };
    return { Items: Items?.map((item) => unmarshall(item)) };
  }),
  "user.listProjects": t.procedure.query(async ({ ctx, input }) => {
    const cookies = cookiesFromRequest(ctx.request);

    const userId = await getLoggedInUserId(cookies);
    if (!userId) {
      return [];
    }

    return await listUserProjects(ctx, userId);
  }),
  "user.listRepositories": t.procedure
    .input(z.object({}))
    .query(async ({ ctx, input }) => {
      throw new Error("Not implemented");
    }),
});
