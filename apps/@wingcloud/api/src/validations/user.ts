import * as z from "zod";

import { userIdFromString } from "../types/user.js";

export const userId = () =>
  z.string().transform((value, ctx) => {
    try {
      return userIdFromString(value);
    } catch (error) {
      if (error instanceof Error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid input: ${error.message.toLowerCase()}`,
        });

        return z.never;
      } else {
        throw error;
      }
    }
  });
