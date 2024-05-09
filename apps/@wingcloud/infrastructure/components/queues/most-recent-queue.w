bring "./fifoqueue" as fifoqueue;
bring dynamodb;
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
  pub table: dynamodb.Table;

  new(props: MostRecentQueueProps) {
    let handler = props.handler;
    this.table = new dynamodb.Table(
      name: "table",
      attributes: [{
        "name": "groupId",
        "type": "S",
      }],
      hashKey: "groupId",
    );
    this.queue = new fifoqueue.FifoQueue();
    this.queue.setConsumer(inflight (event: str) => {
      log("consuming message: {event}");
      let message = MostRecentQueueMessage.parseJson(event);
      let item = this.table.get({
        Key:{
          groupId: message.groupId,
        }
      });
      if let lastMessageTimestamp = item.Item?.tryGet("lastMessageTimestamp")?.tryGet("value")?.tryAsStr() {
        let lastTimestamp = num.fromStr(lastMessageTimestamp);
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
      this.table.transactWrite(TransactItems: [
        {
         Update: {
          Key: {
            groupId: message.groupId,
          },
          UpdateExpression: "SET lastMessageTimestamp = :lastMessageTimestamp, id = :id",
          ExpressionAttributeValues: {
            ":lastMessageTimestamp": message.timestamp,
            ":id": id,
          },
          ConditionExpression: "attribute_not_exists(lastMessageTimestamp) OR lastMessageTimestamp < :lastMessageTimestamp",
          },
        },
      ]);

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
