import * as childProcess from "node:child_process";

import {
  CreateTableCommand,
  DynamoDBClient,
  KeyType,
  KeySchemaElement,
} from "@aws-sdk/client-dynamodb";

export const createTable = async (props) => {
  const client = new DynamoDBClient({
    region: "local",
    credentials: {
      accessKeyId: "x",
      secretAccessKey: "y",
    },
    endpoint: `http://0.0.0.0:${props.port}`,
    // endpoint: `http://127.0.0.1:${props.port}`,
  });

  return client.send(
    new CreateTableCommand({
      TableName: props.tableName,
      AttributeDefinitions: [
        {
          AttributeName: "id",
          AttributeType: "S",
        },
      ],
      KeySchema: [
        {
          AttributeName: "id",
          KeyType: KeyType.HASH,
        },
      ],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );
};

export const execFile = async (command, args, cwd) => {
  return new Promise((resolve, reject) => {
    childProcess.execFile(command, args, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        return reject(error);
      }

      return resolve(stdout ?? stderr);
    });
  });
};
