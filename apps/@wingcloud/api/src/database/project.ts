import { type DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import type { GitHubRepositoryId } from "../types/github.js";
import { createProjectId, type ProjectId } from "../types/project.js";

type Context = {
  dynamodb: DynamoDB;
  tableName: string;
};

export interface ProjectItem {
  projectId: ProjectId;
  name: string;
  repository: GitHubRepositoryId;
}

/**
 * Create a new project.
 */
export const createProject = async (
  context: Context,
  userId: string,
  name: string,
  repository: GitHubRepositoryId,
) => {
  const projectId = await createProjectId();

  const projectItem: ProjectItem = {
    projectId: projectId,
    name: name,
    repository: repository,
  };

  const item = marshall(projectItem);

  await context.dynamodb.transactWriteItems({
    TransactItems: [
      {
        Put: {
          TableName: context.tableName,
          Item: {
            pk: { S: `PROJECT#${projectId}` },
            sk: { S: "#" },
            ...item,
          },
        },
      },
      {
        Put: {
          TableName: context.tableName,
          Item: {
            pk: { S: `USER#${userId}` },
            sk: { S: `PROJECT#${projectId}` },
            ...item,
          },
        },
      },
    ],
  });

  return {
    projectId,
  };
};

/**
 * Get a project by ID.
 */
export const getProject = async (
  context: Context,
  projectId: ProjectId,
): Promise<ProjectItem | undefined> => {
  const { Item } = await context.dynamodb.getItem({
    TableName: context.tableName,
    Key: {
      pk: {
        S: `PROJECT#${projectId}`,
      },
      sk: {
        S: "#",
      },
    },
  });

  if (!Item) {
    return undefined;
  }

  return unmarshall(Item) as ProjectItem;
};

/**
 * List the projects for a user.
 */
export const listUserProjects = async (context: Context, userId: string) => {
  const { Items } = await context.dynamodb.query({
    TableName: context.tableName,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
    ExpressionAttributeValues: {
      ":pk": {
        S: `USER#${userId}`,
      },
      ":sk": {
        S: "PROJECT#",
      },
    },
  });

  return Items?.map((item) => unmarshall(item)) ?? [];
};
