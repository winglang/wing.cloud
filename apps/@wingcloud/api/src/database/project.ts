import { AttributeValue, type DynamoDB } from "@aws-sdk/client-dynamodb";

import type { GitHubRepositoryId } from "../types/github.js";
import { createProjectId, type ProjectId } from "../types/project.js";

type Context = {
  dynamodb: DynamoDB;
  tableName: string;
};

export interface ProjectItem {
  projectId: { S: ProjectId };
  name: { S: string };
  repository: { S: GitHubRepositoryId };
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
    projectId: { S: projectId },
    name: { S: name },
    repository: { S: repository },
  };

  await context.dynamodb.transactWriteItems({
    TransactItems: [
      {
        Put: {
          TableName: context.tableName,
          Item: {
            pk: { S: `PROJECT#${projectId}` },
            sk: { S: "#" },
            ...projectItem,
          },
        },
      },
      {
        Put: {
          TableName: context.tableName,
          Item: {
            pk: { S: `USER#${userId}` },
            sk: { S: `PROJECT#${projectId}` },
            ...projectItem,
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

  return Item as ProjectItem | undefined;
};
