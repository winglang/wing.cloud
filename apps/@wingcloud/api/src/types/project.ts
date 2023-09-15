import { buildPrefixedTypeId, type TypeOf } from "@wingcloud/type-prefixed-id";

const { createId, idFromString, valueType } = buildPrefixedTypeId("project");

/**
 * Represents a project ID.
 *
 * @example "project_abc123"
 */
export type ProjectId = TypeOf<typeof valueType>;

export { createId as createProjectId, idFromString as projectIdFromString };
