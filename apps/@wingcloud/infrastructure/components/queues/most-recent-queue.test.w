bring cloud;
bring ex;
bring expect;
bring util;
bring "./most-recent-queue.w" as queue;

let bucket = new cloud.Bucket();
let counter = new cloud.Counter();
let mrq = new queue.MostRecentQueue(handler: inflight (message: queue.MostRecentQueueMessage) => {
  log("start {Json.stringify(message)}");
  bucket.put("{message.timestamp}", message.body);
  counter.inc();
  log("end {Json.stringify(message)}");
});

test "will only enqueue newer messages" {
  expect.equal(true, mrq.enqueue(groupId: "k1", timestamp: 1, body: "body1"));
  expect.equal(true, mrq.enqueue(groupId: "k2", timestamp: 1, body: "body1"));

  let var rows = mrq.table.scan();
  let var item = rows.Items.at(0);
  let var timestamp = num.fromStr(item.get("lastMessageTimestamp").get("value").asStr());

  expect.equal(2, rows.Items.length);
  expect.equal(1, timestamp);
  expect.equal(true, mrq.enqueue(groupId: "k1", timestamp: 2, body: "body1"));
  expect.equal(true, mrq.enqueue(groupId: "k2", timestamp: 2, body: "body1"));

  rows = mrq.table.scan();
  item = rows.Items.at(0);
  timestamp = num.fromStr(item.get("lastMessageTimestamp").get("value").asStr());

  expect.equal(2, rows.Items.length);
  expect.equal(2, timestamp);
  expect.equal(false, mrq.enqueue(groupId: "k1", timestamp: 0, body: "body1"));

  rows = mrq.table.scan();
  item = rows.Items.at(0);
  timestamp = num.fromStr(item.get("lastMessageTimestamp").get("value").asStr());

  expect.equal(2, rows.Items.length);
  expect.equal(2, timestamp);
}

test "will handle only recent messages" {
  expect.equal(true, mrq.enqueue(groupId: "k1", timestamp: 1, body: "body1"));
  expect.equal(true, mrq.enqueue(groupId: "k1", timestamp: 2, body: "body1"));
  expect.equal(true, mrq.enqueue(groupId: "k1", timestamp: 3, body: "body1"));

  util.sleep(5s);
  expect.equal(1, counter.peek());

  expect.equal(true, mrq.enqueue(groupId: "k1", timestamp: 4, body: "body1"));
  expect.equal(true, mrq.enqueue(groupId: "k1", timestamp: 5, body: "body1"));

  util.sleep(5s);
  expect.equal(2, counter.peek());

  expect.equal(true, bucket.exists("3"));
  expect.equal(true, bucket.exists("5"));
}
