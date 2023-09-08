import type { OpaqueType } from "@wingcloud/opaque-type";

/**
 * Represents a GitHub login name.
 */
export type GitHubLogin = OpaqueType<string, { readonly t: unique symbol }>;
