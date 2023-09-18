import * as z from "zod";

import { environmentIdFromString } from "../types/environment.js";

export const environmentId = () =>
  z.string().transform((value, ctx) => {
    try {
      return environmentIdFromString(value);
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
