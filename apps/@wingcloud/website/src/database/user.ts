import { dynamodb, TableName } from "virtual:@wingcloud/astro/dynamodb";

import type { GitHubLogin } from "../types/github.js";
import { createUserId, type UserId } from "../types/user.js";

/**
 * Get the user ID from a GitHub login.
 */
export const getUserIdFromLogin = async (login: GitHubLogin) => {
  const { Item } = await dynamodb.getItem({
    TableName: TableName,
    Key: {
      pk: {
        S: `login#${login}`,
      },
      sk: {
        S: "#",
      },
    },
    AttributesToGet: ["userId"],
  });

  return Item?.["userId"]?.S as UserId | undefined;
};

/**
 * Create a new user given a GitHub login.
 *
 * @throws If a user with the same GitHub login already exists.
 */
export const createUser = async (login: GitHubLogin) => {
  const userId = await createUserId();

  // Perform a transaction to ensure that the user is created atomically.
  await dynamodb.transactWriteItems({
    TransactItems: [
      // This item is used to look up the user ID from the GitHub login,
      // and to ensure there's only one user per GitHub login.
      {
        Put: {
          TableName,
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
          TableName,
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
  });

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
