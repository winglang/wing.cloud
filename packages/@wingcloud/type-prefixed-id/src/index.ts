import { nanoid62 } from "@wingcloud/nanoid62";

/**
 * Represents a prefixed ID.
 */
export type PrefixedId<T extends string> = `${T}_${string}`;

/**
 * @internal
 */
declare const symbol: unique symbol;

/**
 * Represents a value type.
 *
 * @internal
 */
export interface ValueType<T extends string> {
  readonly [symbol]: T;
}

/**
 * Returns type holded by the value type.
 *
 * @example ```ts
 * const { createId, idFromString, valueType } = buildPrefixedTypeId("project");
 * export type ProjectId = TypeFromValueType<typeof valueType>;
 * ```
 */
export type TypeFromValueType<T> = T extends ValueType<infer U>
  ? U extends PrefixedId<infer R>
    ? PrefixedId<R>
    : never
  : never;

export interface BuildPrefixedTypeIdResult<T extends string> {
  /**
   * Creates a new ID.
   *
   * @example ```ts
   * const id = await createId();
   * ```
   */
  createId(): Promise<PrefixedId<T>>;

  /**
   * Creates an ID from a string. Validates that the string starts with the prefix.
   *
   * @example ```ts
   * const id = idFromString("user_abc123");
   * ```
   */
  idFromString(id: string): PrefixedId<T>;

  /**
   * The type of the ID. Can be used to export the type.
   *
   * @example ```ts
   * const { createId, idFromString, valueType } = buildPrefixedTypeId("project");
   * export type ProjectId = TypeOf<typeof valueType>;
   * ```
   */
  readonly valueType: ValueType<PrefixedId<T>>;
}

/**
 * Builds a type-safe ID type with a prefix.
 *
 * Uses nanoid62 to generate IDs.
 *
 * @example ```ts
 * // types/project-id.ts
 * const { createId, idFromString, valueType } = buildPrefixedTypeId("project");
 * export type ProjectId = TypeOf<typeof valueType>;
 * export { createId as createProjectId, idFromString as projectIdFromString };
 * ```
 */
export const buildPrefixedTypeId = <T extends string>(
  prefix: T,
): BuildPrefixedTypeIdResult<T> => {
  type Id = PrefixedId<T>;

  return {
    async createId() {
      return `${prefix}_${await nanoid62()}`;
    },
    idFromString(id) {
      if (!id.startsWith(`${prefix}_`)) {
        throw new Error(`Must start with "${prefix}_"`);
      }

      return id as Id;
    },
    valueType: {} as ValueType<Id>,
  };
};
