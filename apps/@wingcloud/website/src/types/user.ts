import { nanoid62 } from "@wingcloud/nanoid62";
import type { OpaqueType } from "@wingcloud/opaque-type";

/**
 * Represents a user ID.
 *
 * @example "user_abc123"
 */
export type UserId = OpaqueType<
  `user_${string}`,
  { readonly t: unique symbol }
>;

/**
 * Create a new user ID.
 */
export const createUserId = async () => {
  return `user_${await nanoid62()}` as UserId;
};
