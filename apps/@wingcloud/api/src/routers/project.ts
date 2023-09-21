import { createProject } from "../database/project.js";
import { t } from "../trpc.js";
import { gitHubRepositoryIdFromString } from "../types/github.js";
import * as z from "../validations/index.js";

export const router = t.router({
  "project.get": t.procedure
    .input(z.projectId())
    .query(async ({ ctx, input }) => {
      return {
        projectId: input,
      };
    }),
  "project.listEnvironments": t.procedure
    .input(z.object({}))
    .query(async ({ ctx, input }) => {
      throw new Error("Not implemented");
    }),
  "project.rename": t.procedure
    .input(z.object({}))
    .mutation(async ({ ctx, input }) => {
      throw new Error("Not implemented");
    }),
  "project.delete": t.procedure
    .input(z.object({}))
    .mutation(async ({ ctx, input }) => {
      throw new Error("Not implemented");
    }),
  "project.changeBuildSettings": t.procedure
    .input(z.object({}))
    .mutation(async ({ ctx, input }) => {
      throw new Error("Not implemented");
    }),
  "project.listEnvironmentVariables": t.procedure
    .input(z.object({}))
    .query(async ({ ctx, input }) => {
      throw new Error("Not implemented");
    }),
  "project.updateEnvironmentVariables": t.procedure
    .input(z.object({}))
    .mutation(async ({ ctx, input }) => {
      throw new Error("Not implemented");
    }),
  "user.createProject": t.procedure
    .input(
      z.object({
        projectName: z.string(),
        repositoryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new Error("Not logged in");
      }
      const { projectId } = await createProject(
        ctx,
        ctx.userId,
        input.projectName,
        gitHubRepositoryIdFromString(ctx.userId, input.repositoryId),
      );

      return {
        projectId,
      };
    }),
});
