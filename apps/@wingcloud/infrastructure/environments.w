bring ex;
bring "./nanoid62.w" as nanoid62;

pub struct Environment {
  id: str;
  appId: str;
  repo: str;
  branch: str;
  status: str;
  prNumber: num;
  installationId: num;
  url: str?;
  commentId: num?;
}

struct CreateEnvironmentOptions {
  appId: str;
  repo: str;
  branch: str;
  status: str;
  prNumber: num;
  installationId: num;
}

struct UpdateEnvironmentStatusOptions {
  id: str;
  appId: str;
  status: str;
}

struct UpdateEnvironmentUrlOptions {
  id: str;
  appId: str;
  url: str;
}

struct UpdateEnvironmentCommentIdOptions {
  id: str;
  appId: str;
  commentId: num;
}

struct GetEnvironmentOptions {
  id: str;
}

struct ListEnvironmentOptions {
  appId: str;
}

pub class Environments {
  table: ex.DynamodbTable;

  init(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateEnvironmentOptions): Environment {
    let environment = Environment {
      id: "environment_${nanoid62.Nanoid62.generate()}",
      appId: options.appId,
      repo: options.repo,
      branch: options.branch,
      status: options.status,
      prNumber: options.prNumber,
      installationId: options.installationId,
    };

    this.table.transactWriteItems(transactItems: [
      {
        put: {
          item: {
            pk: "ENVIRONMENT#${environment.id}",
            sk: "#",
            id: environment.id,
            appId: environment.appId,
            repo: environment.repo,
            branch: environment.branch,
            status: environment.status,
            prNumber: environment.prNumber,
            installationId: environment.installationId,
          },
          conditionExpression: "attribute_not_exists(pk)"
        },
      },
      {
        put: {
          item: {
            pk: "APP#${environment.appId}",
            sk: "ENVIRONMENT#${environment.id}",
            id: environment.id,
            appId: environment.appId,
            repo: environment.repo,
            branch: environment.branch,
            status: environment.status,
            prNumber: environment.prNumber,
            installationId: environment.installationId,
          },
        },
      },
    ]);

    return environment;
  }

  pub inflight updateStatus(options: UpdateEnvironmentStatusOptions) {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "ENVIRONMENT#${options.id}",
            sk: "#",
          },
          updateExpression: "SET #status = :status",
          conditionExpression: "attribute_exists(#pk) and #appId = :appId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#status": "status",
            "#appId": "appId",
          },
          expressionAttributeValues: {
            ":status": options.status,
            ":appId": options.appId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#${options.appId}",
            sk: "ENVIRONMENT#${options.id}",
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

  pub inflight updateUrl(options: UpdateEnvironmentUrlOptions) {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "ENVIRONMENT#${options.id}",
            sk: "#",
          },
          updateExpression: "SET #url = :url",
          conditionExpression: "attribute_exists(#pk) and #appId = :appId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#url": "url",
            "#appId": "appId",
          },
          expressionAttributeValues: {
            ":url": options.url,
            ":appId": options.appId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#${options.appId}",
            sk: "ENVIRONMENT#${options.id}",
          },
          updateExpression: "SET #url = :url",
          expressionAttributeNames: {
            "#url": "url",
          },
          expressionAttributeValues: {
            ":url": options.url,
          },
        }
      },
    ]);
  }

  pub inflight updateCommentId(options: UpdateEnvironmentCommentIdOptions) {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "ENVIRONMENT#${options.id}",
            sk: "#",
          },
          updateExpression: "SET #commentId = :commentId",
          conditionExpression: "attribute_exists(#pk) and #appId = :appId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#commentId": "commentId",
            "#appId": "appId",
          },
          expressionAttributeValues: {
            ":commentId": options.commentId,
            ":appId": options.appId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#${options.appId}",
            sk: "ENVIRONMENT#${options.id}",
          },
          updateExpression: "SET #commentId = :commentId",
          expressionAttributeNames: {
            "#commentId": "commentId",
          },
          expressionAttributeValues: {
            ":commentId": options.commentId,
          },
        }
      },
    ]);
  }

  pub inflight get(options: GetEnvironmentOptions): Environment {
    let result = this.table.getItem(
      key: {
        pk: "ENVIRONMENT#${options.id}",
        sk: "#",
      },
    );

    if let item = result.item {
      return {
        id: item.get("id").asStr(),
        appId: item.get("appId").asStr(),
        repo: item.get("repo").asStr(),
        branch: item.get("branch").asStr(),
        status: item.get("status").asStr(),
        prNumber: item.get("prNumber").asNum(),
        installationId: item.get("installationId").asNum(),
        url: item.tryGet("url")?.asStr(),
        commentId: item.tryGet("commentId")?.tryAsNum(),
      };
    }

    throw "Environment [${options.id}] not found";
  }

  pub inflight list(options: ListEnvironmentOptions): Array<Environment> {
    let result = this.table.query(
      keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      expressionAttributeValues: {
        ":pk": "APP#${options.appId}",
        ":sk": "ENVIRONMENT#",
      },
    );
    let var environments: Array<Environment> = [];
    for item in result.items {
      environments = environments.concat([{
        id: item.get("id").asStr(),
        appId: item.get("appId").asStr(),
        repo: item.get("repo").asStr(),
        branch: item.get("branch").asStr(),
        status: item.get("status").asStr(),
        prNumber: item.get("prNumber").asNum(),
        installationId: item.get("installationId").asNum(),
        url: item.tryGet("url")?.asStr(),
        commentId: item.tryGet("commentId")?.tryAsNum(),
      }]);
    }
    return environments;
  }
}
