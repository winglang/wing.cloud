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
  repository: GitHubRepositoryId,
) => {
  const projectId = await createProjectId();

  await context.dynamodb.putItem({
    TableName: context.tableName,
    Item: {
      pk: { S: `PROJECT#${projectId}` },
      sk: { S: "#" },
      projectId: { S: projectId },
      name: { S: repository },
      repository: { S: repository },
    },
  });

  return {
    projectId,
  };
};
