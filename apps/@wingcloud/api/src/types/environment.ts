import {
  buildPrefixedTypeId,
  type TypeFromValueType,
} from "@wingcloud/type-prefixed-id";

const { createId, idFromString, valueType } =
  buildPrefixedTypeId("environment");

export {
  createId as createEnvironmentId,
  idFromString as environmentIdFromString,
};

/**
 * Represents an environment ID.
 *
 * @example "environment_abc123"
 * @see {@link idFromString|environmentIdFromString}
 * @see {@link createId|createEnvironmentId}
 */
export type EnvironmentId = TypeFromValueType<typeof valueType>;
