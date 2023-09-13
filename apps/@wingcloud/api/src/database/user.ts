import type { DynamoDB } from "@aws-sdk/client-dynamodb";

import type { GitHubLogin } from "../types/github.js";
import { createUserId, type UserId } from "../types/user.js";

type Context = {
  dynamodb: DynamoDB;
  tableName: string;
};

/**
 * Get the user ID from a GitHub login.
 */
export const getUserIdFromLogin = async (
  context: Context,
  login: GitHubLogin,
) => {
  const { Item } = await context.dynamodb.getItem({
    TableName: context.tableName,
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
export const createUser = async (context: Context, login: GitHubLogin) => {
  const userId = await createUserId();

  // Perform a transaction to ensure that the user is created atomically.
  await context.dynamodb.transactWriteItems({
    TransactItems: [
      // This item is used to look up the user ID from the GitHub login,
      // and to ensure there's only one user per GitHub login.
      {
        Put: {
          TableName: context.tableName,
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
          ConditionExpression: "attribute_not_exists(pk)",
        },
      },
      // This item holds the user data.
      {
        Put: {
          TableName: context.tableName,
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
 * Create or update a user given a GitHub login.
 */
export const createOrUpdateUser = async (
  context: Context,
  login: GitHubLogin,
  token: string,
  refresh_token: string,
) => {
  let userId = await getUserIdFromLogin(context, login);
  if (!userId) {
    userId = await createUser(context, login);
  }
  // store token and refresh_token
  await context.dynamodb.updateItem({
    TableName: context.tableName,
    Key: {
      pk: {
        S: `login#${login}`,
      },
      sk: {
        S: "#",
      },
    },
    AttributeUpdates: {
      token: {
        Value: {
          S: token,
        },
      },
      refresh_token: {
        Value: {
          S: refresh_token,
        },
      },
    },
  });

  return userId;
};

/**
 * Get the user ID for a GitHub login, creating the user if necessary.
 */
export const getOrCreateUser = async (context: Context, login: GitHubLogin) => {
  const userId = await getUserIdFromLogin(context, login);

  return userId ?? (await createUser(context, login));
};
