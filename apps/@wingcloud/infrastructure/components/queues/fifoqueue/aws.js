// eslint-disable-next-line unicorn/prefer-module
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

// eslint-disable-next-line unicorn/prefer-module
exports._push = async (queueUrl, message, groupId) => {
  const client = new SQSClient();
  return client.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: message,
      MessageGroupId: groupId,
    }),
  );
};
