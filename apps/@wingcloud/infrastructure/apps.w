bring ex;
bring "./nanoid62.w" as nanoid62;

pub struct App {
  id: str;
  name: str;
  description: str?;
  repository: str;
  userId: str;
  entryfile: str;
  createdAt: str?;
  createdBy: str?;
  updatedAt: str?;
  updatedBy: str?;
  imageUrl: str?;
  lastCommitMessage: str?;
}

struct CreateAppOptions {
  name: str;
  description: str?;
  repository: str;
  userId: str;
  entryfile: str;
  createdAt: str;
  createdBy: str;
  imageUrl: str?;
  lastCommitMessage: str?;
}

struct RenameAppOptions {
  id: str;
  name: str;
  userId: str;
  repository: str;
}

struct GetAppOptions {
  id: str;
}

struct ListAppsOptions {
  userId: str;
}

struct DeleteAppOptions {
  id: str;
  userId: str;
  repository: str;
}

struct ListAppByRepositoryOptions {
  repository: str;
}

pub class Apps {
  table: ex.DynamodbTable;

  init(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateAppOptions): App {
    let app = App {
      id: "app_${nanoid62.Nanoid62.generate()}",
      name: options.name,
      description: options.description,
      imageUrl: options.imageUrl,
      repository: options.repository,
      userId: options.userId,
      entryfile: options.entryfile,
      createdAt: options.createdAt,
      createdBy: options.createdBy,
      updatedAt: options.createdAt,
      updatedBy: options.createdBy,
      lastCommitMessage: options.lastCommitMessage,
    };

    this.table.transactWriteItems(transactItems: [
      {
        put: {
          item: {
            pk: "APP#${app.id}",
            sk: "#",
            id: app.id,
            name: app.name,
            description: app.description,
            imageUrl: app.imageUrl,
            repository: app.repository,
            userId: app.userId,
            entryfile: app.entryfile,
            createdAt: app.createdAt,
            createdBy: app.createdBy,
            updatedAt: app.updatedAt,
            updatedBy: app.updatedBy,
            lastCommitMessage: app.lastCommitMessage,
          },
          conditionExpression: "attribute_not_exists(pk)"
        },
      },
      {
        put: {
          item: {
            pk: "USER#${options.userId}",
            sk: "APP#${app.id}",
            id: app.id,
            name: app.name,
            description: app.description,
            imageUrl: app.imageUrl,
            repository: app.repository,
            userId: app.userId,
            entryfile: app.entryfile,
            createdAt: app.createdAt,
            createdBy: app.createdBy,
            updatedAt: app.updatedAt,
            updatedBy: app.updatedBy,
            lastCommitMessage: app.lastCommitMessage,
          },
        },
      },
      {
        put: {
          item: {
            pk: "REPOSITORY#${options.repository}",
            sk: "APP#${app.id}",
            id: app.id,
            name: app.name,
            description: app.description,
            imageUrl: app.imageUrl,
            repository: app.repository,
            userId: app.userId,
            entryfile: app.entryfile,
            createdAt: app.createdAt,
            createdBy: app.createdBy,
            updatedAt: app.updatedAt,
            updatedBy: app.createdBy,
            lastCommitMessage: app.lastCommitMessage,
          },
        },
      },
    ]);

    return app;
  }

  pub inflight rename(options: RenameAppOptions): void {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "APP#${options.id}",
            sk: "#",
          },
          updateExpression: "SET #name = :name",
          conditionExpression: "attribute_exists(#pk) and #userId = :userId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#name": "name",
            "#userId": "userId",
          },
          expressionAttributeValues: {
            ":name": options.name,
            ":userId": options.userId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "USER#${options.userId}",
            sk: "APP#${options.id}",
          },
          updateExpression: "SET #name = :name",
          expressionAttributeNames: {
            "#name": "name",
          },
          expressionAttributeValues: {
            ":name": options.name,
          },
        }
      },
      {
        update: {
          key: {
            pk: "REPOSITORY#${options.repository}",
            sk: "APP#${options.id}",
          },
          updateExpression: "SET #name = :name",
          expressionAttributeNames: {
            "#name": "name",
          },
          expressionAttributeValues: {
            ":name": options.name,
          },
        }
      },
    ]);
  }

  pub inflight get(options: GetAppOptions): App {
    let result = this.table.getItem(
      key: {
        pk: "APP#${options.id}",
        sk: "#",
      },
    );

    if let item = result.item {
      return {
        id: item.get("id").asStr(),
        description: item.tryGet("description")?.tryAsStr(),
        name: item.get("name").asStr(),
        repository: item.get("repository").asStr(),
        userId: item.get("userId").asStr(),
        entryfile: item.get("entryfile").asStr(),
      };
    }

    throw "App [${options.id}] not found";
  }

  pub inflight list(options: ListAppsOptions): Array<App> {
    let result = this.table.query(
      keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      expressionAttributeValues: {
        ":pk": "USER#${options.userId}",
        ":sk": "APP#",
      },
    );
    let var apps: Array<App> = [];
    for item in result.items {
      apps = apps.concat([App {
        id: item.get("id").asStr(),
        name: item.get("name").asStr(),
        description: item.tryGet("description")?.tryAsStr(),
        imageUrl: item.tryGet("imageUrl")?.tryAsStr(),
        repository: item.get("repository").asStr(),
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
    this.table.transactWriteItems(
      transactItems: [
        {
          delete: {
            key: {
              pk: "APP#${options.id}",
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
              pk: "USER#${options.userId}",
              sk: "APP#${options.id}",
            },
          },
        },
        {
          delete: {
            key: {
              pk: "REPOSITORY#${options.repository}",
              sk: "APP#${options.id}",
            },
          },
        },
      ],
    );
  }

  pub inflight listByRepository(options: ListAppByRepositoryOptions): Array<App> {
    let result = this.table.query(
      keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      expressionAttributeValues: {
        ":pk": "REPOSITORY#${options.repository}",
        ":sk": "APP#",
      },
    );
    let var apps: Array<App> = [];
    for item in result.items {
      apps = apps.concat([App {
        id: item.get("id").asStr(),
        name: item.get("name").asStr(),
        description: item.tryGet("description")?.tryAsStr(),
        repository: item.get("repository").asStr(),
        userId: item.get("userId").asStr(),
        entryfile: item.get("entryfile").asStr(),
      }]);
    }
    return apps;
  }
}
