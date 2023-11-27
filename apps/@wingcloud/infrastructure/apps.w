bring ex;
bring "./nanoid62.w" as nanoid62;

pub struct App {
  appId: str;
  appName: str;
  description: str?;
  repoOwner: str;
  repoName: str;
  repoId: str;
  userId: str;
  entryfile: str;
  createdAt: str;
  createdBy: str;
  updatedAt: str;
  updatedBy: str;
  imageUrl: str?;
  lastCommitMessage: str?;
}

struct Item extends App {
  pk: str;
  sk: str;
}

struct CreateAppOptions {
  appName: str;
  description: str;
  repoOwner: str;
  repoName: str;
  repoId: str;
  userId: str;
  entryfile: str;
  createdAt: str;
  createdBy: str;
  imageUrl: str?;
  lastCommitMessage: str?;
}

struct RenameAppOptions {
  appId: str;
  appName: str;
  userId: str;
  repository: str;
}

struct GetAppOptions {
  appId: str;
}

struct GetAppByNameOptions {
  userId: str;
  appName: str;
}

struct ListAppsOptions {
  userId: str;
}

struct DeleteAppOptions {
  appId: str;
  userId: str;
}

struct ListAppByRepositoryOptions {
  repository: str;
}

struct MakeItemOptions {
  appId: str;
  pk: str;
  sk: str;
}

struct UpdateEntryfileOptions {
  appId: str;
  appName: str;
  userId: str;
  repository: str;
  entryfile: str;
}

pub class Apps {
  table: ex.DynamodbTable;

  new(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateAppOptions): App {
    // check if app name exists
    let existingApp = this.table.getItem(
      key: {
        pk: "USER#{options.userId}",
        sk: "APP_NAME#{options.appName}",
      },
    );

    if let item = existingApp.item {
      throw "App name {options.appName} already exists";
    }

    let appId = "app_{nanoid62.Nanoid62.generate()}";

    // TODO: use spread operator when it's supported https://github.com/winglang/wing/issues/3855
    let makeItem = (ops: MakeItemOptions): Item => {
      return {
        pk: ops.pk,
        sk: ops.sk,
        appId: ops.appId,
        appName: options.appName,
        description: options.description,
        imageUrl: options.imageUrl,
        repoId: options.repoId,
        repoOwner: options.repoOwner,
        repoName: options.repoName,
        userId: options.userId,
        entryfile: options.entryfile,
        createdAt: options.createdAt,
        createdBy: options.createdBy,
        updatedAt: options.createdAt,
        updatedBy: options.createdBy,
        lastCommitMessage: options.lastCommitMessage,
      };
    };

    this.table.transactWriteItems(transactItems: [
      {
        put: {
          item: makeItem(
            appId: appId,
            pk: "APP#{appId}",
            sk: "#",
          ),
          conditionExpression: "attribute_not_exists(pk)"
        },
      },
      {
        put: {
          item: makeItem(
            appId: appId,
            pk: "USER#{options.userId}",
            sk: "APP_NAME#{options.appName}",
          ),
          conditionExpression: "attribute_not_exists(pk)"
        },
      },
      {
        put: {
          item: makeItem(
            appId: appId,
            pk: "USER#{options.userId}",
            sk: "APP#{appId}",
          ),
        },
      },
      {
        put: {
          item: makeItem(
            appId: appId,
            pk: "REPOSITORY#{options.repoId}",
            sk: "APP#{appId}",
          ),
        },
      },

    ]);

    return {
      appId: appId,
      appName: options.appName,
      description: options.description,
      imageUrl: options.imageUrl,
      repoId: options.repoId,
      repoOwner: options.repoOwner,
      repoName: options.repoName,
      userId: options.userId,
      entryfile: options.entryfile,
      createdAt: options.createdAt,
      createdBy: options.createdBy,
      updatedAt: options.createdAt,
      updatedBy: options.createdBy,
      lastCommitMessage: options.lastCommitMessage,
    };
  }

  pub inflight rename(options: RenameAppOptions): void {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "#",
          },
          updateExpression: "SET #appName = :appName",
          conditionExpression: "attribute_exists(#pk) and #userId = :userId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#appName": "appName",
            "#userId": "userId",
          },
          expressionAttributeValues: {
            ":appName": options.appName,
            ":userId": options.userId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "USER#{options.userId}",
            sk: "APP#{options.appId}",
          },
          updateExpression: "SET #appName = :appName",
          expressionAttributeNames: {
            "#appName": "appName",
          },
          expressionAttributeValues: {
            ":appName": options.appName,
          },
        }
      },
      {
        update: {
          key: {
            pk: "REPOSITORY#{options.repository}",
            sk: "APP#{options.appId}",
          },
          updateExpression: "SET #appName = :appName",
          expressionAttributeNames: {
            "#appName": "appName",
          },
          expressionAttributeValues: {
            ":appName": options.appName,
          },
        }
      },
    ]);
  }

  pub inflight get(options: GetAppOptions): App {
    let result = this.table.getItem(
      key: {
        pk: "APP#{options.appId}",
        sk: "#",
      },
    );

    if let item = result.item {
      return {
        appId: item.get("appId").asStr(),
        appName: item.get("appName").asStr(),
        description: item.tryGet("description")?.tryAsStr(),
        imageUrl: item.tryGet("imageUrl")?.tryAsStr(),
        repoId: item.get("repoId").asStr(),
        repoOwner: item.get("repoOwner").asStr(),
        repoName: item.get("repoName").asStr(),
        userId: item.get("userId").asStr(),
        entryfile: item.get("entryfile").asStr(),
        createdAt: item.get("createdAt").asStr(),
        createdBy: item.get("createdBy").asStr(),
        updatedAt: item.get("updatedAt").asStr(),
        updatedBy: item.get("updatedBy").asStr(),
        lastCommitMessage: item.tryGet("lastCommitMessage")?.tryAsStr(),
      };
    }

    throw "App [{options.appId}] not found";
  }

  pub inflight getByName(options: GetAppByNameOptions): App {
    let result = this.table.getItem(
      key: {
        pk: "USER#{options.userId}",
        sk: "APP_NAME#{options.appName}",
      },
    );

    if let item = result.item {
      return {
        appId: item.get("appId").asStr(),
        appName: item.get("appName").asStr(),
        description: item.tryGet("description")?.tryAsStr(),
        imageUrl: item.tryGet("imageUrl")?.tryAsStr(),
        repoId: item.get("repoId").asStr(),
        repoOwner: item.get("repoOwner").asStr(),
        repoName: item.get("repoName").asStr(),
        userId: item.get("userId").asStr(),
        entryfile: item.get("entryfile").asStr(),
        createdAt: item.get("createdAt").asStr(),
        createdBy: item.get("createdBy").asStr(),
        updatedAt: item.get("updatedAt").asStr(),
        updatedBy: item.get("updatedBy").asStr(),
        lastCommitMessage: item.tryGet("lastCommitMessage")?.tryAsStr(),
      };
    }

<<<<<<< HEAD
    throw "App name [{options.appName}] not found";
=======
    throw "App name {options.appName} not found";
>>>>>>> main
  }

  pub inflight list(options: ListAppsOptions): Array<App> {
    let result = this.table.query(
      keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      expressionAttributeValues: {
        ":pk": "USER#{options.userId}",
        ":sk": "APP#",
      },
    );
    let var apps: Array<App> = [];
    for item in result.items {
      apps = apps.concat([App {
        appId: item.get("appId").asStr(),
        appName: item.get("appName").asStr(),
        description: item.tryGet("description")?.tryAsStr(),
        imageUrl: item.tryGet("imageUrl")?.tryAsStr(),
        repoId: item.get("repoId").asStr(),
        repoOwner: item.get("repoOwner").asStr(),
        repoName: item.get("repoName").asStr(),
        userId: item.get("userId").asStr(),
        entryfile: item.get("entryfile").asStr(),
        createdAt: item.get("createdAt").asStr(),
        createdBy: item.get("createdBy").asStr(),
        updatedAt: item.get("updatedAt").asStr(),
        updatedBy: item.get("updatedBy").asStr(),
        lastCommitMessage: item.tryGet("lastCommitMessage")?.tryAsStr(),
      }]);
    }
    return apps;
  }

  pub inflight delete(options: DeleteAppOptions): void {

    let result = this.table.getItem(
      key: {
        pk: "APP#{options.appId}",
        sk: "#",
      },
    );

    if let app = result.item {
      let appName = app.get("appName").asStr();
      let repoId = app.get("repoId").asStr();

      this.table.transactWriteItems(
        transactItems: [
          {
            delete: {
              key: {
                pk: "APP#{options.appId}",
                sk: "#",
              },
              conditionExpression: "#userId = :userId",
              expressionAttributeNames: {
                "#userId": "userId",
              },
              expressionAttributeValues: {
                ":userId": options.userId,
              },
            },
          },
          {
            delete: {
              key: {
                pk: "USER#{options.userId}",
                sk: "APP#{options.appId}",
              },
            },
          },
          {
            delete: {
              key: {
                pk: "USER#{options.userId}",
                sk: "APP_NAME#{appName}",
              },
            },
          },
          {
            delete: {
              key: {
                pk: "REPOSITORY#{repoId}",
                sk: "APP#{options.appId}",
              },
            },
          },
        ],
      );
      return;
    }

    throw "App not found";
  }

  pub inflight listByRepository(options: ListAppByRepositoryOptions): Array<App> {
    let result = this.table.query(
      keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      expressionAttributeValues: {
        ":pk": "REPOSITORY#{options.repository}",
        ":sk": "APP#",
      },
    );
    let var apps: Array<App> = [];
    for item in result.items {
      apps = apps.concat([App {
        appId: item.get("appId").asStr(),
        appName: item.get("appName").asStr(),
        description: item.tryGet("description")?.tryAsStr(),
        repoId: item.get("repoId").asStr(),
        repoOwner: item.get("repoOwner").asStr(),
        repoName: item.get("repoName").asStr(),
        userId: item.get("userId").asStr(),
        entryfile: item.get("entryfile").asStr(),
        createdAt: item.get("createdAt").asStr(),
        createdBy: item.get("createdBy").asStr(),
        updatedAt: item.get("updatedAt").asStr(),
        updatedBy: item.get("updatedBy").asStr(),
        lastCommitMessage: item.tryGet("lastCommitMessage")?.tryAsStr(),
      }]);
    }
    return apps;
  }

  pub inflight updateEntrypoint(options: UpdateEntryfileOptions): void {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "#",
          },
          updateExpression: "SET #entryfile = :entryfile",
          conditionExpression: "attribute_exists(#pk) and #userId = :userId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#entryfile": "entryfile",
            "#userId": "userId",
          },
          expressionAttributeValues: {
            ":entryfile": options.entryfile,
            ":userId": options.userId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "USER#{options.userId}",
            sk: "APP#{options.appId}",
          },
          updateExpression: "SET #entryfile = :entryfile",
          expressionAttributeNames: {
            "#entryfile": "entryfile",
          },
          expressionAttributeValues: {
            ":entryfile": options.entryfile,
          },
        }
      },
      {
        update: {
          key: {
            pk: "USER#{options.userId}",
            sk: "APP_NAME#{options.appName}",
          },
          updateExpression: "SET #entryfile = :entryfile",
          expressionAttributeNames: {
            "#entryfile": "entryfile",
          },
          expressionAttributeValues: {
            ":entryfile": options.entryfile,
          },
        }
      },
      {
        update: {
          key: {
            pk: "REPOSITORY#{options.repository}",
            sk: "APP#{options.appId}",
          },
          updateExpression: "SET #entryfile = :entryfile",
          expressionAttributeNames: {
            "#entryfile": "entryfile",
          },
          expressionAttributeValues: {
            ":entryfile": options.entryfile,
          },
        }
      },
    ]);
  }
}
