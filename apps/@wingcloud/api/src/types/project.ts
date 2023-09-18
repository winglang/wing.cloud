import {
  buildPrefixedTypeId,
  type TypeFromValueType,
} from "@wingcloud/type-prefixed-id";

const { createId, idFromString, valueType } = buildPrefixedTypeId("project");

export { createId as createProjectId, idFromString as projectIdFromString };

/**
 * Represents a project ID.
 *
 * @example "project_abc123"
 * @see {@link idFromString|projectIdFromString}
 * @see {@link createId|createProjectId}
 */
export type ProjectId = TypeFromValueType<typeof valueType>;
