bring ex;
bring "./http-error.w" as httpError;
bring "./nanoid62.w" as nanoid62;
bring "./util.w" as util;

pub struct App {
  appId: str;
  appName: str;
  appFullName: str?;
  description: str?;
  repoOwner: str;
  repoName: str;
  repoId: str;
  userId: str;
  entrypoint: str;
  createdAt: str;
  defaultBranch: str?;
  lastCommitMessage: str?;
  lastCommitDate: str?;
  lastCommitSha: str?;
  status: str?;
}

struct Item extends App {
  pk: str;
  sk: str;
}

struct CreateAppOptions {
  appName: str;
  appFullName: str;
  description: str;
  repoOwner: str;
  repoName: str;
  repoId: str;
  userId: str;
  entrypoint: str;
  createdAt: str;
  defaultBranch: str;
  status: str;
  lastCommitMessage: str?;
  lastCommitDate: str?;
  lastCommitSha: str?;
}

struct GetAppOptions {
  appId: str;
}

struct GetAppByNameOptions {
  userId: str;
  appName: str;
  isAdmin: bool?;
}

struct ListAppsOptions {
  userId: str;
  isAdmin: bool?;
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

struct UpdateEntrypointOptions {
  appId: str;
  appName: str;
  userId: str;
  repository: str;
  entrypoint: str;
}

struct UpdateLastCommitOptions {
  appId: str;
  appName: str;
  userId: str;
  repoId: str;
  lastCommitMessage: str;
  lastCommitDate: str;
  lastCommitSha: str;
}

struct UpdateStatusOptions {
  appId: str;
  appName: str;
  userId: str;
  repoId: str;
  status: str;
}

struct UpdateDescriptionOptions {
  appId: str;
  appName: str;
  userId: str;
  repoId: str;
  description: str;
}

pub class Apps {
  table: ex.DynamodbTable;

  new(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateAppOptions): str {
    let appId = "app_{nanoid62.Nanoid62.generate()}";

    // TODO: use spread operator when it's supported https://github.com/winglang/wing/issues/3855
    let makeItem = (ops: MakeItemOptions): Item => {
      return {
        pk: ops.pk,
        sk: ops.sk,
        appId: ops.appId,
        appName: options.appName,
        appFullName: options.appFullName,
        description: options.description,
        repoId: options.repoId,
        repoOwner: options.repoOwner,
        repoName: options.repoName,
        userId: options.userId,
        entrypoint: options.entrypoint,
        createdAt: options.createdAt,
        defaultBranch: options.defaultBranch,
        status: options.status,
        lastCommitMessage: options.lastCommitMessage ?? "",
        lastCommitDate: options.lastCommitDate ?? "",
        lastCommitSha: options.lastCommitSha ?? "",
      };
    };

    try {
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
    } catch error {
      if error.contains("ConditionalCheckFailed") {
        throw httpError.HttpError.forbidden("App '{options.appName}' already exists");
      } else {
        throw httpError.HttpError.error(error);
      }
    }

    return appId;
  }

  pub inflight get(options: GetAppOptions): App {
    let result = this.table.getItem(
      key: {
        pk: "APP#{options.appId}",
        sk: "#",
      },
    );

    if let item = result.item {
      return App.fromJson(item);
    }

    throw httpError.HttpError.notFound("Get App: '{options.appId}' not found");
  }

  pub inflight tryGet(options: GetAppOptions): App? {
    try {
      return this.get(options);
    } catch error {
      return nil;
    }
  }

  pub inflight getByName(options: GetAppByNameOptions): App {

    if options.isAdmin? {
      let result = this.table.scan(
        filterExpression: "begins_with(pk, :pk) AND sk = :sk",
        expressionAttributeValues: {
          ":pk": "USER#",
          ":sk": "APP_NAME#{options.appName}",
        }
      );

      let item = result.items.at(0);
      return App.fromJson(item); 
    } else {
      let result = this.table.getItem(
        key: {
          pk: "USER#{options.userId}",
          sk: "APP_NAME#{options.appName}",
        },
      );

      if let item = result.item {
        return App.fromJson(item);
      }
    }

    throw httpError.HttpError.notFound("App '{options.appName}' not found");
  }

  pub inflight list(options: ListAppsOptions): Array<App> {
    let var exclusiveStartKey: Json? = nil;
    let var apps: Array<App> = [];
    let var searchTerm = options.userId;
    if options.isAdmin? {
      log("Running as an admin user");
      util.Util.do_while(
        handler: () => {
          let result = this.table.scan(
            filterExpression: "begins_with(pk, :pk) AND begins_with(sk, :sk)",
            expressionAttributeValues: {
              ":pk": "USER#",
              ":sk": "APP#",
            },
            exclusiveStartKey: exclusiveStartKey,
          );
          for item in result.items {
            apps = apps.concat([App.fromJson(item)]);
          }
          exclusiveStartKey = result.lastEvaluatedKey;
        },
        condition: () => {
          return exclusiveStartKey?;
        },
      );
    } else {
      util.Util.do_while(
        handler: () => {
          let result = this.table.query(
            keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
            expressionAttributeValues: {
              ":pk": "USER#{options.userId}",
              ":sk": "APP#",
            },
            exclusiveStartKey: exclusiveStartKey,
          );
          for item in result.items {
            apps = apps.concat([App.fromJson(item)]);
          }
          exclusiveStartKey = result.lastEvaluatedKey;
        },
        condition: () => {
          return exclusiveStartKey?;
        },
      );
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

    throw httpError.HttpError.notFound("Delete App: '{options.appId}' not found");
  }

  pub inflight listByRepository(options: ListAppByRepositoryOptions): Array<App> {
    let var exclusiveStartKey: Json? = nil;
    let var apps: Array<App> = [];
    util.Util.do_while(
      handler: () => {
        let result = this.table.query(
          keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
          expressionAttributeValues: {
            ":pk": "REPOSITORY#{options.repository}",
            ":sk": "APP#",
          },
          exclusiveStartKey: exclusiveStartKey,
        );
        for item in result.items {
          apps = apps.concat([App.fromJson(item)]);
        }
        exclusiveStartKey = result.lastEvaluatedKey;
      },
      condition: () => {
        return exclusiveStartKey?;
      },
    );
    return apps;
  }

  pub inflight updateEntrypoint(options: UpdateEntrypointOptions): void {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "#",
          },
          updateExpression: "SET #entrypoint = :entrypoint",
          conditionExpression: "attribute_exists(#pk) and #userId = :userId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#entrypoint": "entrypoint",
            "#userId": "userId",
          },
          expressionAttributeValues: {
            ":entrypoint": options.entrypoint,
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
          updateExpression: "SET #entrypoint = :entrypoint",
          expressionAttributeNames: {
            "#entrypoint": "entrypoint",
          },
          expressionAttributeValues: {
            ":entrypoint": options.entrypoint,
          },
        }
      },
      {
        update: {
          key: {
            pk: "USER#{options.userId}",
            sk: "APP_NAME#{options.appName}",
          },
          updateExpression: "SET #entrypoint = :entrypoint",
          expressionAttributeNames: {
            "#entrypoint": "entrypoint",
          },
          expressionAttributeValues: {
            ":entrypoint": options.entrypoint,
          },
        }
      },
      {
        update: {
          key: {
            pk: "REPOSITORY#{options.repository}",
            sk: "APP#{options.appId}",
          },
          updateExpression: "SET #entrypoint = :entrypoint",
          expressionAttributeNames: {
            "#entrypoint": "entrypoint",
          },
          expressionAttributeValues: {
            ":entrypoint": options.entrypoint,
          },
        }
      },
    ]);
  }

  pub inflight updatLastCommit(options: UpdateLastCommitOptions): void {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "#",
          },
          updateExpression: "SET #lastCommitMessage = :lastCommitMessage, #lastCommitDate = :lastCommitDate, #lastCommitSha = :lastCommitSha",
          conditionExpression: "attribute_exists(#pk) and #userId = :userId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#lastCommitMessage": "lastCommitMessage",
            "#lastCommitDate": "lastCommitDate",
            "#lastCommitSha": "lastCommitSha",
            "#userId": "userId",
          },
          expressionAttributeValues: {
            ":userId": options.userId,
            ":lastCommitMessage": options.lastCommitMessage,
            ":lastCommitDate": options.lastCommitDate,
            ":lastCommitSha": options.lastCommitSha,
          },
        }
      },
      {
        update: {
          key: {
            pk: "USER#{options.userId}",
            sk: "APP#{options.appId}",
          },
          updateExpression: "SET #lastCommitMessage = :lastCommitMessage, #lastCommitDate = :lastCommitDate, #lastCommitSha = :lastCommitSha",
          expressionAttributeNames: {
            "#lastCommitMessage": "lastCommitMessage",
            "#lastCommitDate": "lastCommitDate",
            "#lastCommitSha": "lastCommitSha",
          },
          expressionAttributeValues: {
            ":lastCommitMessage": options.lastCommitMessage,
            ":lastCommitDate": options.lastCommitDate,
            ":lastCommitSha": options.lastCommitSha,
          },
        }
      },
      {
        update: {
          key: {
            pk: "USER#{options.userId}",
            sk: "APP_NAME#{options.appName}",
          },
          updateExpression: "SET #lastCommitMessage = :lastCommitMessage, #lastCommitDate = :lastCommitDate, #lastCommitSha = :lastCommitSha",
          expressionAttributeNames: {
            "#lastCommitMessage": "lastCommitMessage",
            "#lastCommitDate": "lastCommitDate",
            "#lastCommitSha": "lastCommitSha",
          },
          expressionAttributeValues: {
            ":lastCommitMessage": options.lastCommitMessage,
            ":lastCommitDate": options.lastCommitDate,
            ":lastCommitSha": options.lastCommitSha,
          },
        }
      },
      {
        update: {
          key: {
            pk: "REPOSITORY#{options.repoId}",
            sk: "APP#{options.appId}",
          },
          updateExpression: "SET #lastCommitMessage = :lastCommitMessage, #lastCommitDate = :lastCommitDate, #lastCommitSha = :lastCommitSha",
          expressionAttributeNames: {
            "#lastCommitMessage": "lastCommitMessage",
            "#lastCommitDate": "lastCommitDate",
            "#lastCommitSha": "lastCommitSha",
          },
          expressionAttributeValues: {
            ":lastCommitMessage": options.lastCommitMessage,
            ":lastCommitDate": options.lastCommitDate,
            ":lastCommitSha": options.lastCommitSha,
          },
        }
      },
    ]);
  }

  pub inflight updateStatus(options: UpdateStatusOptions): void {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "#",
          },
          updateExpression: "SET #status = :status",
          conditionExpression: "attribute_exists(#pk) and #userId = :userId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#status": "status",
            "#userId": "userId",
          },
          expressionAttributeValues: {
            ":userId": options.userId,
            ":status": options.status,
          },
        }
      },
      {
        update: {
          key: {
            pk: "USER#{options.userId}",
            sk: "APP#{options.appId}",
          },
          updateExpression: "SET #status = :status",
          expressionAttributeNames: {
            "#status": "status",

          },
          expressionAttributeValues: {
            ":status": options.status,
          },
        }
      },
      {
        update: {
          key: {
            pk: "USER#{options.userId}",
            sk: "APP_NAME#{options.appName}",
          },
          updateExpression: "SET #status = :status",
          expressionAttributeNames: {
            "#status": "status",

          },
          expressionAttributeValues: {
            ":status": options.status,
          },
        }
      },
      {
        update: {
          key: {
            pk: "REPOSITORY#{options.repoId}",
            sk: "APP#{options.appId}",
          },
          updateExpression: "SET #status = :status",
          expressionAttributeNames: {
            "#status": "status",

          },
          expressionAttributeValues: {
            ":status": options.status,
          },
        }
      },
    ]);
  }

  pub inflight updateDescription(options: UpdateDescriptionOptions): void {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "#",
          },
          updateExpression: "SET #description = :description",
          conditionExpression: "attribute_exists(#pk) and #userId = :userId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#description": "description",
            "#userId": "userId",
          },
          expressionAttributeValues: {
            ":userId": options.userId,
            ":description": options.description,
          },
        }
      },
      {
        update: {
          key: {
            pk: "USER#{options.userId}",
            sk: "APP#{options.appId}",
          },
          updateExpression: "SET #description = :description",
          expressionAttributeNames: {
            "#description": "description",

          },
          expressionAttributeValues: {
            ":description": options.description,
          },
        }
      },
      {
        update: {
          key: {
            pk: "USER#{options.userId}",
            sk: "APP_NAME#{options.appName}",
          },
          updateExpression: "SET #description = :description",
          expressionAttributeNames: {
            "#description": "description",

          },
          expressionAttributeValues: {
            ":description": options.description,
          },
        }
      },
      {
        update: {
          key: {
            pk: "REPOSITORY#{options.repoId}",
            sk: "APP#{options.appId}",
          },
          updateExpression: "SET #description = :description",
          expressionAttributeNames: {
            "#description": "description",

          },
          expressionAttributeValues: {
            ":description": options.description,
          },
        }
      },
    ]);
  }
}
