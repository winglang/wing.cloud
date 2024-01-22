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
        "groupId": "S",
      },
      hashKey: "groupId",
    );
    this.queue = new fifoqueue.FifoQueue();
    this.queue.setConsumer(inflight (event: str) => {
      log("consuming message: {event}");
      let message = MostRecentQueueMessage.parseJson(event);
      let item = this.table.getItem({
        key:{
          groupId: message.groupId,
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
          groupId: message.groupId,
        },
        updateExpression: "SET lastMessageTimestamp = :lastMessageTimestamp, id = :id",
        expressionAttributeValues: {
          ":lastMessageTimestamp": message.timestamp,
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
