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
}

struct GetProjectOptions {
    id: str;
}

struct ListProjectsOptions {
    userId: str;
}

struct DeleteProjectOptions {
    id: str;
}

class Projects {
    table: ex.DynamodbTable;

    init() {
        this.table = new ex.DynamodbTable(
            name: "projects",
            attributeDefinitions: {
                "pk": "S",
                "sk": "S",
            },
            hashKey: "pk",
            rangeKey: "sk",
        );
    }

    pub inflight create(options: CreateProjectOptions): Project {
        let project = Project {
            id: "project_${nanoid62.Nanoid62.generate()}",
            name: options.name,
            repository: options.repository,
            userId: options.userId,
        };

        this.table.transactWriteItems(transactItems: [
          ex.DynamodbTransactWriteItem {
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
          ex.DynamodbTransactWriteItem {
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
      let project = this.get(id: options.id);

      // TODO: Need something like Promise.all() to run these in parallel.
      this.table.updateItem({
        key: {
          pk: "PROJECT#${project.id}",
          sk: "#",
        },
        updateExpression: "SET #name = :name",
        expressionAttributeNames: {
          "#name": "name",
        },
        expressionAttributeValues: {
          ":name": options.name,
        },
      });

      this.table.updateItem({
        key: {
          pk: "USER#${project.userId}",
          sk: "PROJECT#${project.id}",
        },
        updateExpression: "SET #name = :name",
        expressionAttributeNames: {
          "#name": "name",
        },
        expressionAttributeValues: {
          ":name": options.name,
        },
      });
    }

    pub inflight get(options: GetProjectOptions): Project {
        let item = this.table.getItem({
            pk: "PROJECT#${options.id}",
            sk: "#",
        });

        return Project {
            id: item.get("id").asStr(),
            name: item.get("name").asStr(),
            repository: item.get("repository").asStr(),
            userId: item.get("userId").asStr(),
        };
    }

    pub inflight list(options: ListProjectsOptions): Array<Project> {
      // TODO: Implement DynamoDB query.
      return [];
    }

    pub inflight delete(options: DeleteProjectOptions): void {
      let project = this.get(id: options.id);
      this.table.deleteItem({
        key: {
          pk: "PROJECT#${options.id}",
          sk: "#",
        },
      });
      this.table.deleteItem({
        key: {
          pk: "USER#${project.userId}",
          sk: "PROJECT#${project.id}",
        },
      });
    }
}
