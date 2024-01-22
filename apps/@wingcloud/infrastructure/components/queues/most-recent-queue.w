bring "./fifoqueue" as fifoqueue;
bring ex;
bring util;

pub struct MostRecentQueueMessage {
  id: str;
  groupId: str;
  timestamp: num;
  body: str;
}

pub struct EnqueueOptions {
  groupId: str;
  timestamp: num;
  body: str;
}

pub struct MostRecentQueueProps {
  handler: inflight (MostRecentQueueMessage): void;
}

pub class MostRecentQueue {
  queue: fifoqueue.FifoQueue;
  pub table: ex.DynamodbTable;

  new(props: MostRecentQueueProps) {
    let handler = props.handler;
    this.table = new ex.DynamodbTable(
      name: "table",
      attributeDefinitions: {
        "pk": "S",
        "sk": "S",
      },
      hashKey: "pk",
      rangeKey: "sk",
    );
    this.queue = new fifoqueue.FifoQueue();
    this.queue.setConsumer(inflight (event: str) => {
      log("consuming message: {event}");
      let message = MostRecentQueueMessage.parseJson(event);
      let item = this.table.getItem({
        key:{
          pk: "QUEUE_MESSAGE#{message.groupId}",
          sk: "#",
        }
      });

      if let lastTimestamp = item?.item?.tryGet("lastMessageTimestamp")?.tryAsNum() {
        if lastTimestamp <= message.timestamp {
          log("handling message: {event}, {lastTimestamp}");
          handler(message);
        }
      }
    });
  }

  pub inflight enqueue(message: EnqueueOptions): bool {
    try {
      log("enqueueing message: {Json.stringify(message)} {datetime.utcNow().timestampMs}");
      let id = util.nanoid();
      this.table.updateItem(
        key: {
          pk: "QUEUE_MESSAGE#{message.groupId}",
          sk: "#",
        },
        updateExpression: "SET lastMessageTimestamp = :lastMessageTimestamp, groupId = :groupId, id = :id",
        expressionAttributeValues: {
          ":lastMessageTimestamp": message.timestamp,
          ":groupId": message.groupId,
          ":id": id,
        },
        conditionExpression: "attribute_not_exists(lastMessageTimestamp) OR lastMessageTimestamp < :lastMessageTimestamp",
        returnValues: "ALL_NEW"
      );
      log("message enqueued: {Json.stringify(message)}");

      this.queue.push(Json.stringify(MostRecentQueueMessage{
        id: id,
        groupId: message.groupId,
        timestamp: message.timestamp,
        body: message.body,
      }), groupId: message.groupId);
      return true;
    } catch err {
      return false;
    }
  }
}
