import { t } from "../trpc.js";
import * as z from "../validations/index.js";

export const router = t.router({
  "environment.get": t.procedure
    .input(z.environmentId())
    .query(async ({ ctx, input }) => {
      throw new Error("Not implemented");
      return {
        environmentId: input,
      };
    }),
  "environment.updateStatus": t.procedure
    .input(z.environmentId())
    .mutation(async ({ ctx, input }) => {
      throw new Error("Not implemented");
      return {
        environmentId: input,
      };
    }),
  "environment.getLogsPresignedURL": t.procedure
    .input(z.environmentId())
    .mutation(async ({ ctx, input }) => {
      throw new Error("Not implemented");
      return {
        presignedURL: "",
      };
    }),
});
