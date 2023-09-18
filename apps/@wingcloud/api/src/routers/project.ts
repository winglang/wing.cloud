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
        owner: z.string(),
        projectName: z.string(),
        repositoryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      throw new Error("Not implemented");
    }),
});
