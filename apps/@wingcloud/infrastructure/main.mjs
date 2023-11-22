import {
  CreateTableCommand,
  PutItemCommand,
  GetItemCommand,
  DynamoDBClient,
  KeyType,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBStreamsClient,
  GetRecordsCommand,
  ListStreamsCommand,
  GetShardIteratorCommand,
  DescribeStreamCommand,
} from "@aws-sdk/client-dynamodb-streams";

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
      StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: "NEW_AND_OLD_IMAGES",
      },
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

const processStreamRecords = async (client, streamArn) => {
  try {
    // Describe the stream to get the shards
    const streamData = await client.send(
      new DescribeStreamCommand({ StreamArn: streamArn }),
    );
    const shards = streamData.StreamDescription.Shards;

    for (const shard of shards) {
      // Get a shard iterator for the current shard
      const shardIteratorData = await client.send(
        new GetShardIteratorCommand({
          StreamArn: streamArn,
          ShardId: shard.ShardId,
          ShardIteratorType: "TRIM_HORIZON",
        }),
      );

      let shardIterator = shardIteratorData.ShardIterator;

      while (shardIterator) {
        // Use the shard iterator to read stream records
        const recordsData = await client.send(
          new GetRecordsCommand({
            ShardIterator: shardIterator,
          }),
        );

        // Process each record
        for (const record of recordsData.Records) {
          console.log("Record:", record);
          // Here you would typically process the record
          // For example, you could invoke a Lambda function with the record data
        }

        // Get the next shard iterator
        shardIterator = recordsData.NextShardIterator;

        // Sleep for a short time before the next get records request to avoid empty responses
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  } catch (error) {
    console.error("Error processing stream records:", error);
  }
};

export const processRecords = async (props) => {
  // client.send(new GetRecordscomman());
  const client = new DynamoDBStreamsClient({
    region: "local",
    credentials: {
      accessKeyId: "x",
      secretAccessKey: "y",
    },
    endpoint: props.endpoint,
  });

  const {
    Streams: [{ StreamArn }],
  } = await client.send(
    new ListStreamsCommand({
      TableName: props.tableName,
    }),
  );

  processStreamRecords(client, StreamArn);

  // const {
  //   Streams: [{ StreamArn }],
  // } = await client.send(
  //   new ListStreamsCommand({
  //     TableName: props.tableName,
  //   }),
  // );
  // console.log({ StreamArn });

  // const { ShardIterator } = await client.send(
  //   new GetShardIteratorCommand({
  //     StreamArn,
  //     ShardId: "shardId-000000000000",
  //     ShardIteratorType: "TRIM_HORIZON",
  //   }),
  // );
  // console.log({ ShardIterator });

  // const records = await client.send(
  //   new GetRecordsCommand({
  //     ShardIterator,
  //   }),
  // );

  // console.log(records);
};
