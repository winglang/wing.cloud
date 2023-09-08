import { customAlphabet } from "nanoid";

export const base62Alphabet =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" as const;

const DEFAULT_SIZE = 22;

const nanoid = customAlphabet(base62Alphabet, DEFAULT_SIZE);

/**
 * Generate secure URL-friendly unique ID.
 *
 * By default, the ID will have 22 symbols to have a collision probability
 * similar to UUID v4.
 *
 * @param size Size of the ID. The default size is 22.
 * @returns A random string.
 */
export const nanoid62 = async (size?: number | undefined) => {
  return nanoid(size);
};
