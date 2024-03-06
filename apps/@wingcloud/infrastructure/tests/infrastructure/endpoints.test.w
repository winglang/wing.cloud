bring ex;
bring "../endpoints.w" as Endpoints;

let table = new ex.DynamodbTable(
  name: "data",
  attributeDefinitions: {
    "pk": "S",
    "sk": "S",
  },
  hashKey: "pk",
  rangeKey: "sk",
);

let endpoints = new Endpoints.Endpoints(table);

test "storing and listing endpoints" {
  let endpoint1 = endpoints.create(
    appId: "test-app",
    digest: "digest1",
    environmentId: "env-test",
    localUrl: "localhost:80",
    path: "resource-1",
    port: 80,
    publicUrl: "example.com", 
    label: "Endpoint for cloud.Api",
    browserSupport: false);
  let endpoint2 = endpoints.create(
    appId: "test-app",
    digest: "digest2",
    environmentId: "env-test",
    localUrl: "localhost:80",
    path: "resource-2",
    port: 80,
    publicUrl: "example2.com", 
    label: "Endpoint for cloud.Api",
    browserSupport: false);
  let endpoint3 = endpoints.create(
    appId: "test-app",
    digest: "digest3",
    environmentId: "env-test-2",
    localUrl: "localhost:80",
    path: "resource-3",
    port: 80,
    publicUrl: "example3.com", 
    label: "Endpoint for cloud.Api",
    browserSupport: false);

  let storedEndpoints = endpoints.list(environmentId: "env-test");
  
  assert(storedEndpoints.length == 2);
  assert(storedEndpoints.at(0).digest == "digest1" || storedEndpoints.at(0).digest == "digest2");
  assert(storedEndpoints.at(1).digest == "digest1" || storedEndpoints.at(1).digest == "digest2");
}

test "get and delete endpoint" {
  let endpoint1 = endpoints.create(
    appId: "test-app",
    digest: "digest1",
    environmentId: "env-test",
    localUrl: "localhost:80",
    path: "resource-1",
    port: 80,
    publicUrl: "example.com", 
    label: "Endpoint for cloud.Api",
    browserSupport: false);

  assert(endpoints.get(environmentId: "env-test", id: endpoint1.id) == endpoint1);

  endpoints.delete(environmentId: "env-test", id: endpoint1.id);

  try {
    endpoints.get(environmentId: "env-test", id: endpoint1.id);
    assert(false);
  } catch e {
    assert(true);
  }
}
