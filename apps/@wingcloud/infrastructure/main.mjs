import {
  CreateTableCommand,
  PutItemCommand,
  GetItemCommand,
  DynamoDBClient,
  KeyType,
} from "@aws-sdk/client-dynamodb";

export const createClient = (props) => {
  return new DynamoDBClient({
    region: "local",
    credentials: {
      accessKeyId: "x",
      secretAccessKey: "y",
    },
    endpoint: props.endpoint,
  });
};

export const createTable = async (client, props) => {
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

export const testClient = async (client, props) => {
  await client.send(
    new PutItemCommand({
      TableName: props.tableName,
      Item: {
        id: { S: "1" },
        name: { S: "test" },
      },
    }),
  );

  return await client.send(
    new GetItemCommand({
      TableName: props.tableName,
      Key: {
        id: { S: "1" },
      },
    }),
  );
};
