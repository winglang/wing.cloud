bring ex;
bring "./nanoid62.w" as nanoid62;

struct Project {
  id: str;
  name: str;
  repository: str;
  userId: str;
}

struct CreateProjectOptions {
  name: str;
  repository: str;
  userId: str;
}

struct RenameProjectOptions {
  id: str;
  name: str;
  userId: str;
}

struct GetProjectOptions {
  id: str;
}

struct ListProjectsOptions {
  userId: str;
}

struct DeleteProjectOptions {
  id: str;
  userId: str;
}

class Projects {
  table: ex.DynamodbTable;

  init(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateProjectOptions): Project {
    let project = Project {
      id: "project_${nanoid62.Nanoid62.generate()}",
      name: options.name,
      repository: options.repository,
      userId: options.userId,
    };

    this.table.transactWriteItems(transactItems: [
      {
        put: {
          item: {
            pk: "PROJECT#${project.id}",
            sk: "#",
            id: project.id,
            name: project.name,
            repository: project.repository,
            userId: project.userId,
          },
          conditionExpression: "attribute_not_exists(pk)"
        },
      },
      {
        put: {
          item: {
            pk: "USER#${options.userId}",
            sk: "PROJECT#${project.id}",
            id: project.id,
            name: project.name,
            repository: project.repository,
            userId: project.userId,
          },
        },
      },
    ]);

    return project;
  }

  pub inflight rename(options: RenameProjectOptions): void {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "PROJECT#${options.id}",
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
            sk: "PROJECT#${options.id}",
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

  pub inflight get(options: GetProjectOptions): Project {
    let result = this.table.getItem(
      key: {
        pk: "PROJECT#${options.id}",
        sk: "#",
      },
    );

    if let item = result.item {
      return {
        id: item.get("id").asStr(),
        name: item.get("name").asStr(),
        repository: item.get("repository").asStr(),
        userId: item.get("userId").asStr(),
      };
    }

    throw "Project [${options.id}] not found";
  }

  pub inflight list(options: ListProjectsOptions): Array<Project> {
    let result = this.table.query(
      keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      expressionAttributeValues: {
        ":pk": "USER#${options.userId}",
        ":sk": "PROJECT#",
      },
    );
    let var projects: Array<Project> = [];
    for item in result.items {
      projects = projects.concat([Project {
        id: item.get("id").asStr(),
        name: item.get("name").asStr(),
        repository: item.get("repository").asStr(),
        userId: item.get("userId").asStr(),
      }]);
    }
    return projects;
  }

  pub inflight delete(options: DeleteProjectOptions): void {
    this.table.transactWriteItems(
      transactItems: [
        {
          delete: {
            key: {
              pk: "PROJECT#${options.id}",
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
              sk: "PROJECT#${options.id}",
            },
          },
        },
      ],
    );
  }
}
