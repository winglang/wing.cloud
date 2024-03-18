bring ex;
bring "../environments.w" as Environments;
bring "./util.w" as Util;
bring expect;

let table = new Util.MakeTable().get();
let environments = new Environments.Environments(table);

test "Create a new environment" {
  let envData = Util.DataFactory.makeEnvironmentData();
  let environment = environments.create(envData);

  expect.equal(environment.appId, envData.appId);
}

test "Update environment status" {
  let envData = Util.DataFactory.makeEnvironmentData();
  let environment = environments.create(envData);
  let newStatus = "updated";

  environments.updateStatus(id: environment.id, appId: environment.appId, status: newStatus);
  let updatedEnvironment = environments.get(id: environment.id);

  expect.equal(updatedEnvironment.status, newStatus);
}

test "Update environment SHA" {
  let envData = Util.DataFactory.makeEnvironmentData();
  let environment = environments.create(envData);
  let newSha = "newSha1234";

  environments.updateSha(id: environment.id, appId: environment.appId, sha: newSha);
  let updatedEnvironment = environments.get(id: environment.id);

  expect.equal(updatedEnvironment.sha, newSha);
}

test "Update environment public key" {
  let envData = Util.DataFactory.makeEnvironmentData();
  let environment = environments.create(envData);
  let newPublicKey = "newPublicKey1234";

  environments.updatePublicKey(id: environment.id, appId: environment.appId, publicKey: newPublicKey);
  let updatedEnvironment = environments.get(id: environment.id);

  expect.equal(updatedEnvironment.publicKey, newPublicKey);
}

test "Update environment URL" {
  let envData = Util.DataFactory.makeEnvironmentData();
  let environment = environments.create(envData);
  let newUrl = "https://newurl.com";

  environments.updateUrl(id: environment.id, appId: environment.appId, url: newUrl);
  let updatedEnvironment = environments.get(id: environment.id);

  expect.equal(updatedEnvironment.url, newUrl);
}

test "Update environment comment ID" {
  let envData = Util.DataFactory.makeEnvironmentData();
  let environment = environments.create(envData);
  let newCommentId = 12345;

  environments.updateCommentId(id: environment.id, appId: environment.appId, commentId: newCommentId);
  let updatedEnvironment = environments.get(id: environment.id);

  expect.equal(updatedEnvironment.commentId, newCommentId);
}

test "Update environment test results" {
  let envData = Util.DataFactory.makeEnvironmentData();
  let environment = environments.create(envData);
  let newTestResults = Util.DataFactory.makeTestResults();

  expect.nil(environment.testResults);

  environments.updateTestResults(id: environment.id, appId: environment.appId, testResults: newTestResults);
  let updatedEnvironment = environments.get(id: environment.id);

  expect.equal(Json.stringify(updatedEnvironment.testResults), Json.stringify(newTestResults));
}

test "Clear environment test results" {
  let envData = Util.DataFactory.makeEnvironmentData();
  let environment = environments.create(envData);

  environments.clearTestResults(id: environment.id, appId: environment.appId);
  let updatedEnvironment = environments.get(id: environment.id);

  expect.equal(updatedEnvironment.testResults, nil);
}

test "List environments" {
  let envData1 = Util.DataFactory.makeEnvironmentData();
  environments.create(envData1);

  let envData2 = Util.DataFactory.makeEnvironmentData();
  environments.create(envData2);

  let envList = environments.list(appId: envData1.appId);
  assert(envList.length >= 2);
}

test "Delete environment" {
  let envData = Util.DataFactory.makeEnvironmentData();
  let environment = environments.create(envData);

  environments.delete(appId: environment.appId, environmentId: environment.id);

  let deletedEnv = environments.tryGet(id: environment.id);
  expect.equal(deletedEnv, nil);
}
