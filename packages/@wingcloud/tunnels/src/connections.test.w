bring expect;
bring "./connections.w" as connections;

let conn = new connections.Connections();

test "should add and remove connections" {
  conn.addConnection(connectionId: "con1", subdomain: "sub1");
  conn.addConnection(connectionId: "con2", subdomain: "sub2");
  expect.equal(conn.findConnectionBySubdomain("sub1")?.connectionId, "con1");
  expect.equal(conn.findConnectionBySubdomain("sub2")?.connectionId, "con2");

  conn.removeConnection("con1");
  expect.equal(conn.findConnectionBySubdomain("sub1"), nil);
}

test "cant add the same subdomain twice" {
  conn.addConnection(connectionId: "con1", subdomain: "sub1");
  let var isThrown = false;
  try {
    conn.addConnection(connectionId: "con2", subdomain: "sub1");
    isThrown = false;
  } catch e {
    isThrown = true;
  }

  expect.equal(isThrown, true);
}

test "should add and remove requests for connection" {
  conn.addResponseForRequest("req1", { fieldA: "valueA" });
  expect.equal(conn.findResponseForRequest("req1")?.get("fieldA"), "valueA");

  conn.removeResponseForRequest("req1");
  expect.equal(conn.findResponseForRequest("req1"), nil);
}
