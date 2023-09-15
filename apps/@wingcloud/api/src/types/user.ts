import { buildPrefixedTypeId, type TypeOf } from "@wingcloud/type-prefixed-id";

const { createId, idFromString, valueType } = buildPrefixedTypeId("user");

/**
 * Represents a user ID.
 *
 * @example "user_abc123"
 */
export type UserId = TypeOf<typeof valueType>;

export { createId as createUserId, idFromString as userIdFromString };
