export * from "zod";

import * as z from "zod";

import { gitHubLoginFromString } from "./types/github.js";
import { userIdFromString } from "./types/user.js";

export const gitHubLogin = () =>
  z
    .string()
    .min(1)
    .transform((value) => gitHubLoginFromString(value));

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
