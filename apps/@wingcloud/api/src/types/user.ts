import { nanoid62 } from "@wingcloud/nanoid62";
import type { OpaqueType } from "@wingcloud/opaque-type";

const PREFIX = "user_" as const;

/**
 * Represents a user ID.
 *
 * @example "user_abc123"
 */
export type UserId = OpaqueType<
  `${typeof PREFIX}${string}`,
  { readonly t: unique symbol }
>;

/**
 * Create a new user ID.
 */
export const createUserId = async () => {
  return `${PREFIX}${await nanoid62()}` as UserId;
};

/**
 * Creates a user ID from a string.
 */
export const userIdFromString = (userId: string): UserId => {
  if (!userId.startsWith(PREFIX)) {
    throw new Error(`Must start with "${PREFIX}"`);
  }

  return userId as UserId;
};
