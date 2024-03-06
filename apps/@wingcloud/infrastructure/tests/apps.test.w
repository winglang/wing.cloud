bring ex;
bring "../apps.w" as Apps;
bring "./util.w" as Util;

let table = new Util.MakeTable().get();

let apps = new Apps.Apps(table);

test "Create a new app" {
  let appData = Apps.CreateAppOptions {
    appFullName: "Test App",
    appName: "testapp",
    createdAt: "2019-01-01T00:00:00Z",
    description: "This is a test app",
    defaultBranch: "main",
    entrypoint: "main.w",
    repoId: "testrepo",
    repoName: "testrepo",
    repoOwner: "testowner",
    status: "running",
    userId: "testuser",
  };

  let appId = apps.create(appData);

  let app = apps.get(appId: appId);
  assert(app.appFullName == appData.appFullName);
}
