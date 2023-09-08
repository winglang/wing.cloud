import {
  GetItemCommand,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { nanoid62 } from "@wingcloud/nanoid62";
import type { OpaqueType } from "@wingcloud/opaque-type";
import * as dynamodb from "virtual:@wingcloud/astro-dynamodb-integration";

import type { GitHubLogin } from "../utils/github.js";

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
 * Get the user ID from a GitHub login.
 */
export const getUserIdFromLogin = async (login: GitHubLogin) => {
  const { Item } = await dynamodb.client.send(
    new GetItemCommand({
      TableName: dynamodb.TableName,
      Key: {
        pk: {
          S: `login#${login}`,
        },
        sk: {
          S: "#",
        },
      },
      AttributesToGet: ["userId"],
    }),
  );

  return Item?.["userId"]?.S as UserId | undefined;
};

/**
 * Create a new user ID.
 */
export const createUserId = async () => {
  return `user_${await nanoid62()}` as UserId;
};

/**
 * Create a new user.
 */
export const createUser = async (login: GitHubLogin) => {
  const userId = await createUserId();

  // Perform a transaction to ensure that the user is created atomically.
  await dynamodb.client.send(
    new TransactWriteItemsCommand({
      TransactItems: [
        // This item is used to look up the user ID from the GitHub login,
        // and to ensure there's only one user per GitHub login.
        {
          Put: {
            TableName: dynamodb.TableName,
            Item: {
              pk: {
                S: `login#${login}`,
              },
              sk: {
                S: "#",
              },
              userId: {
                S: userId,
              },
            },
          },
        },
        // This item holds the user data.
        {
          Put: {
            TableName: dynamodb.TableName,
            Item: {
              pk: {
                S: `user#${userId}`,
              },
              sk: {
                S: "#",
              },
              userId: {
                S: userId,
              },
              login: {
                S: login,
              },
            },
          },
        },
      ],
    }),
  );

  return userId;
};

/**
 * Get the user ID for a GitHub login, creating the user if necessary.
 */
export const getOrCreateUser = async (login: GitHubLogin) => {
  let userId = await getUserIdFromLogin(login);
  if (!userId) {
    userId = await createUser(login);
  }
  return userId;
};
