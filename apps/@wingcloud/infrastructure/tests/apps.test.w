bring ex;
bring "../apps.w" as Apps;
bring "./util.w" as Util;
bring expect;

let table = new Util.MakeTable().get();
let apps = new Apps.Apps(table);

test "Create a new app" {
  let appData = Util.DataFactory.makeAppData();
  let appId = apps.create(appData);

  expect.notNil(appId);
}

test "Get an app by id" {
  let appData = Util.DataFactory.makeAppData();
  let appId = apps.create(appData);
  let app = apps.get(appId: appId);

  expect.equal(app.appId, appId);
}

test "Get an app by name" {
  let appData = Util.DataFactory.makeAppData();
  apps.create(appData);
  let app = apps.getByName(userId: appData.userId, appName: appData.appName);

  expect.equal(app.appName, appData.appName);
}

test "List apps" {
  apps.create(Util.DataFactory.makeAppData(appName: "testapp1", userId: "userId"));
  apps.create(Util.DataFactory.makeAppData(appName: "testapp2", userId: "userId"));
  let appList = apps.list(userId: "userId");

  assert(appList.length >= 2);
}

test "Delete an app" {
  let appId = apps.create(Util.DataFactory.makeAppData(userId: "userId"));
  apps.delete(appId: appId, userId: "userId");

  expect.nil(apps.tryGet(appId: appId));
}

test "List apps by repository" {
  apps.create(Util.DataFactory.makeAppData(appName: "testapp1", repoId: "repoId"));
  apps.create(Util.DataFactory.makeAppData(appName: "testapp2", repoId: "repoId"));
  let appList = apps.listByRepository(repository: "repoId");

  expect.equal(appList.length, 2);
}

test "Update entrypoint" {
  let appData = Util.DataFactory.makeAppData();
  let appId = apps.create(appData);
  apps.updateEntrypoint(
    appId: appId,
    appName: appData.appName,
    userId: appData.userId,
    repository: appData.repoId,
    entrypoint: "updatedMain.w"
  );
  let app = apps.get(appId: appId);

  expect.equal(app.entrypoint, "updatedMain.w");
}

test "Update last commit" {
  let appData = Util.DataFactory.makeAppData();
  let appId = apps.create(appData);
  let newLastCommitMessage = "feat: add test for updating last commit.";
  let newLastCommitDate = "2022-01-02T00:00:00Z";
  let newLastCommitSha = "abcd1234efgh5678";

  apps.updateLastCommit(
    appId: appId,
    appName: appData.appName,
    userId: appData.userId,
    repoId: appData.repoId,
    lastCommitMessage: newLastCommitMessage,
    lastCommitDate: newLastCommitDate,
    lastCommitSha: newLastCommitSha
  );

  let app = apps.get(appId: appId);

  expect.equal(app.lastCommitMessage, newLastCommitMessage);
  expect.equal(app.lastCommitDate, newLastCommitDate);
  expect.equal(app.lastCommitSha, newLastCommitSha);
}

test "Update status" {
  let appData = Util.DataFactory.makeAppData();
  let appId = apps.create(appData);
  let newStatus = "inactive";

  apps.updateStatus(
    appId: appId,
    appName: appData.appName,
    userId: appData.userId,
    repoId: appData.repoId,
    status: newStatus
  );

  let app = apps.get(appId: appId);

  expect.equal(app.status, newStatus);
}

test "Update description" {
  let appData = Util.DataFactory.makeAppData();
  let appId = apps.create(appData);
  let newDescription = "Updated description for the application.";

  apps.updateDescription(
    appId: appId,
    appName: appData.appName,
    userId: appData.userId,
    repoId: appData.repoId,
    description: newDescription
  );

  let app = apps.get(appId: appId);

  expect.equal(app.description, newDescription);
}
