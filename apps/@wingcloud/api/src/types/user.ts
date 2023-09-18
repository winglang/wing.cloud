import {
  buildPrefixedTypeId,
  type TypeFromValueType,
} from "@wingcloud/type-prefixed-id";

const { createId, idFromString, valueType } = buildPrefixedTypeId("user");

export { createId as createUserId, idFromString as userIdFromString };

/**
 * Represents a user ID.
 *
 * @example "user_abc123"
 * @see {@link idFromString|userIdFromString}
 * @see {@link createId|createUserId}
 */
export type UserId = TypeFromValueType<typeof valueType>;
