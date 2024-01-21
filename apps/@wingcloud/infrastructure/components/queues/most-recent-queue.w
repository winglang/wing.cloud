bring "./fifoqueue" as fifoqueue;
bring ex;

pub struct MostRecentQueueMessage {
  id: str;
  timestamp: num;
  body: str;
}

pub struct EnqueueOptions {
  id: str;
  timestamp: num;
  body: str;
}

pub struct MostRecentQueueProps {
  handler: inflight (MostRecentQueueMessage): void;
  table: ex.DynamodbTable;
}

pub class MostRecentQueue {
  queue: fifoqueue.FifoQueue;
  table: ex.DynamodbTable;

  new(props: MostRecentQueueProps) {
    let handler = props.handler;
    this.table = props.table;
    this.queue = new fifoqueue.FifoQueue();
    this.queue.setConsumer(inflight (event: str) => {
      log("consuming message: {event}");
      let message = MostRecentQueueMessage.parseJson(event);
      let item = this.table.getItem({
        key:{
          pk: "QUEUE_MESSAGE#{message.id}",
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
      this.table.updateItem(
        key: {
          pk: "QUEUE_MESSAGE#{message.id}",
          sk: "#",
        },
        updateExpression: "SET lastMessageTimestamp = :lastMessageTimestamp, id = :id",
        expressionAttributeValues: {
          ":lastMessageTimestamp": message.timestamp,
          ":id": message.id,
        },
        conditionExpression: "attribute_not_exists(lastMessageTimestamp) OR lastMessageTimestamp < :lastMessageTimestamp",
        returnValues: "ALL_NEW"
      );
      log("message enqueued: {Json.stringify(message)}");

      this.queue.push(Json.stringify(MostRecentQueueMessage{
        id: message.id,
        timestamp: message.timestamp,
        body: message.body,
      }), groupId: message.id);
      return true;
    } catch err {
      return false;
    }
  }
}
