bring ex;
bring "./nanoid62.w" as nanoid62;

pub struct Environment {
  id: str;
  projectId: str;
  repo: str;
  branch: str;
  status: str;
  prNumber: num;
  installationId: num;
  url: str?;
  commentId: num?;
}

struct CreateEnvironmentOptions {
  projectId: str;
  repo: str;
  branch: str;
  status: str;
  prNumber: num;
  installationId: num;
}

struct UpdateEnvironmentStatusOptions {
  id: str;
  projectId: str;
  status: str;
}

struct UpdateEnvironmentUrlOptions {
  id: str;
  projectId: str;
  url: str;
}

struct UpdateEnvironmentCommentIdOptions {
  id: str;
  projectId: str;
  commentId: num;
}

struct GetEnvironmentOptions {
  id: str;
}

struct ListEnvironmentOptions {
  projectId: str;
}

pub class Environments {
  table: ex.DynamodbTable;

  init(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateEnvironmentOptions): Environment {
    let environment = Environment {
      id: "environment_${nanoid62.Nanoid62.generate()}",
      projectId: options.projectId,
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
            projectId: environment.projectId,
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
            pk: "PROJECT#${environment.projectId}",
            sk: "ENVIRONMENT#${environment.id}",
            id: environment.id,
            projectId: environment.projectId,
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
          conditionExpression: "attribute_exists(#pk) and #projectId = :projectId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#status": "status",
            "#projectId": "projectId",
          },
          expressionAttributeValues: {
            ":status": options.status,
            ":projectId": options.projectId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "PROJECT#${options.projectId}",
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
          conditionExpression: "attribute_exists(#pk) and #projectId = :projectId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#url": "url",
            "#projectId": "projectId",
          },
          expressionAttributeValues: {
            ":url": options.url,
            ":projectId": options.projectId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "PROJECT#${options.projectId}",
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
          conditionExpression: "attribute_exists(#pk) and #projectId = :projectId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#commentId": "commentId",
            "#projectId": "projectId",
          },
          expressionAttributeValues: {
            ":commentId": options.commentId,
            ":projectId": options.projectId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "PROJECT#${options.projectId}",
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
        projectId: item.get("projectId").asStr(),
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
        ":pk": "PROJECT#${options.projectId}",
        ":sk": "ENVIRONMENT#",
      },
    );
    let var environments: Array<Environment> = [];
    for item in result.items {
      environments = environments.concat([{
        id: item.get("id").asStr(),
        projectId: item.get("projectId").asStr(),
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
