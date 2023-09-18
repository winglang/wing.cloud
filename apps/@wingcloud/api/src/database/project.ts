import type { DynamoDB } from "@aws-sdk/client-dynamodb";

import type { GitHubRepositoryId } from "../types/github.js";
import { createProjectId } from "../types/project.js";

type Context = {
  dynamodb: DynamoDB;
  tableName: string;
};

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

  await context.dynamodb.putItem({
    TableName: context.tableName,
    Item: {
      pk: { S: `PROJECT#${projectId}` },
      sk: { S: "#" },
      projectId: { S: projectId },
      name: { S: name },
      repository: { S: repository },
    },
  });

  await context.dynamodb.putItem({
    TableName: context.tableName,
    Item: {
      pk: { S: `USER#${userId}` },
      sk: { S: `PROJECT#${projectId}` },
      projectId: { S: projectId },
    },
  });

  return {
    projectId,
  };
};

/**
 * Get a project by ID.
 */
export const getProject = async (context: Context, projectId: string) => {
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
  console.log({
    id: Item?.["projectId"]?.S as string,
    name: Item?.["name"]?.S as string,
  });

  return {
    id: Item?.["projectId"]?.S as string,
    name: Item?.["name"]?.S as string,
  };
};

/**
 * List the projects for a user.
 */
export const listUserProjects = async (context: Context, userId: string) => {
  const { Items } = await context.dynamodb.query({
    TableName: context.tableName,
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: {
      ":pk": {
        S: `USER#${userId}`,
      },
    },
  });

  return Items?.map((item) => item["projectId"]?.S as string).filter(Boolean);
};
