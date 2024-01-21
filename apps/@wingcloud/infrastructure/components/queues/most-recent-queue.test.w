bring cloud;
bring ex;
bring expect;
bring util;
bring "./most-recent-queue.w" as queue;

let table = new ex.DynamodbTable(
  name: "table",
  attributeDefinitions: {
    "pk": "S",
    "sk": "S",
  },
  hashKey: "pk",
  rangeKey: "sk",
);

let bucket = new cloud.Bucket();
let counter = new cloud.Counter();
let mrq = new queue.MostRecentQueue(table: table, handler: inflight (message: queue.MostRecentQueueMessage) => {
  log("start {Json.stringify(message)}");
  bucket.put("{message.timestamp}", message.body);
  counter.inc();
  log("end {Json.stringify(message)}");
});

// test "will only enqueue newer messages" {
//   expect.equal(true, mrq.enqueue(id: "k1", timestamp: 1, body: "body1"));
//   expect.equal(true, mrq.enqueue(id: "k2", timestamp: 1, body: "body1"));
//   let var rows = table.scan();
//   expect.equal(2, rows.items.length);
//   expect.equal(1, rows.items.at(0).get("lastMessageTimestamp").asNum());
  
//   expect.equal(true, mrq.enqueue(id: "k1", timestamp: 2, body: "body1"));
//   expect.equal(true, mrq.enqueue(id: "k2", timestamp: 2, body: "body1"));
//   rows = table.scan();
//   expect.equal(2, rows.items.length);
//   expect.equal(2, rows.items.at(0).get("lastMessageTimestamp").asNum());
  
//   expect.equal(false, mrq.enqueue(id: "k1", timestamp: 0, body: "body1"));
//   rows = table.scan();
//   expect.equal(2, rows.items.length);
//   expect.equal(2, rows.items.at(0).get("lastMessageTimestamp").asNum());
// }

test "will handle only recent messages" {
  expect.equal(true, mrq.enqueue(id: "k1", timestamp: 1, body: "body1"));
  expect.equal(true, mrq.enqueue(id: "k1", timestamp: 2, body: "body1"));
  expect.equal(true, mrq.enqueue(id: "k1", timestamp: 3, body: "body1"));
  
  util.sleep(5s);
  expect.equal(1, counter.peek());

  expect.equal(true, mrq.enqueue(id: "k1", timestamp: 4, body: "body1"));
  expect.equal(true, mrq.enqueue(id: "k1", timestamp: 5, body: "body1"));

  util.sleep(5s);
  expect.equal(2, counter.peek());

  expect.equal(true, bucket.exists("3"));
  expect.equal(true, bucket.exists("5"));
}
