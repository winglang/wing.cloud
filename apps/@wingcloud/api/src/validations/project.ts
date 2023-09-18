import * as z from "zod";

import { projectIdFromString } from "../types/project.js";

export const projectId = () =>
  z.string().transform((value, ctx) => {
    try {
      return projectIdFromString(value);
    } catch (error) {
      if (error instanceof Error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid input: ${error.message.toLowerCase()}`,
        });

        return z.NEVER;
      } else {
        throw error;
      }
    }
  });
