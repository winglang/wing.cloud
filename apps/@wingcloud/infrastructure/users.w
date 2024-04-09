bring ex;
bring "./nanoid62.w" as Nanoid62;
bring "./http-error.w" as httpError;

pub struct User {
  id: str;
  displayName: str?;
  username: str;
  avatarUrl: str;
  email: str?;
  isAdmin: bool?;
}

struct CreateOptions {
  displayName: str;
  username: str;
  avatarUrl: str?;
  email: str?;
}

struct FromLoginOptions {
  username: str;
}

struct GetOrCreateOptions {
  displayName: str;
  username: str;
  avatarUrl: str?;
  email: str?;
}

struct GetUserOptions {
  userId: str;
}

struct GetUserByNameOptions {
  username: str;
}

struct UpdateOptions {
  userId: str;
  displayName: str;
  username: str;
  avatarUrl: str?;
  email: str?;
}

struct SetAdminRoleOptions {
  userId: str;
  username: str;
  isAdmin: bool;
}

pub class Users {
  table: ex.DynamodbTable;

  new(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateOptions): User {
    let userId = "user_{Nanoid62.Nanoid62.generate()}";

    this.table.transactWriteItems(
      transactItems: [
        {
          put: {
            item: {
              pk: "LOGIN#{options.username}",
              sk: "#",
              id: userId,
              displayName: options.displayName,
              username: options.username,
              avatarUrl: options.avatarUrl ?? "",
              email: options.email ?? "",
            },
            conditionExpression: "attribute_not_exists(pk)",
          },
        },
        {
          put: {
            item: {
              pk: "USER#{userId}",
              sk: "#",
              id: userId,
              displayName: options.displayName,
              username: options.username,
              avatarUrl: options.avatarUrl ?? "",
              email: options.email ?? "",
            },
          }
        }
      ],
    );

    return User {
      id: userId,
      displayName: options.displayName,
      username: options.username,
      avatarUrl: options.avatarUrl ?? "",
      email: options.email ?? "",
    };
  }

  pub inflight update(options: UpdateOptions): void {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "LOGIN#{options.username}",
            sk: "#",
          },
          updateExpression: "SET displayName = :displayName, avatarUrl = :avatarUrl, email = :email",
          expressionAttributeValues: {
            ":displayName": options.displayName,
            ":avatarUrl": options.avatarUrl,
            ":email": options.email,
          },
        }
      },
      {
        update: {
          key: {
            pk: "USER#{options.userId}",
            sk: "#",
          },
          updateExpression: "SET displayName = :displayName, avatarUrl = :avatarUrl, email = :email",
          expressionAttributeValues: {
            ":displayName": options.displayName,
            ":avatarUrl": options.avatarUrl,
            ":email": options.email,
          },
        }
      }
    ]);
  }

  pub inflight fromLogin(options: FromLoginOptions): User? {
    let result = this.table.getItem(
      key: {
        pk: "LOGIN#{options.username}",
        sk: "#",
      },
    );

    return User.fromJson(result.item);
  }

  pub inflight fromLoginOrFail(options: FromLoginOptions): User {
    if let user = this.fromLogin(username: options.username) {
      return user;
    }
    throw httpError.HttpError.notFound("User not found");
  }

  pub inflight updateOrCreate(options: GetOrCreateOptions): User {
    if let user = this.fromLogin(username: options.username) {
      if user.displayName == options.displayName &&
        user.avatarUrl == options.avatarUrl ?? "" &&
        user.email == options.email {
          return user;
      }

      this.update(
        userId: user.id,
        displayName: options.displayName,
        avatarUrl: options.avatarUrl,
        email: options.email,
        username: options.username,
      );

      return User {
        username: options.username,
        avatarUrl: options.avatarUrl ?? "",
        displayName: options.displayName,
        email: options.email,
        id: user.id,
        isAdmin: user.isAdmin,
      };
    } else {
      return this.create(
        displayName: options.displayName,
        username: options.username,
        avatarUrl: options.avatarUrl,
        email: options.email
      );
    }
  }

  pub inflight get(options: GetUserOptions): User {
    let result = this.table.getItem(
      key: {
        pk: "USER#{options.userId}",
        sk: "#",
      },
      projectionExpression: "id, displayName, username, avatarUrl, email, isAdmin",
    );

    if let user = User.tryFromJson(result.item) {
      return user;
    } else {
      throw httpError.HttpError.notFound("User not found");
    }
  }

  pub inflight getByName(options: GetUserByNameOptions): User {
    let result = this.table.getItem(
      key: {
        pk: "LOGIN#{options.username}",
        sk: "#",
      },
      projectionExpression: "id, displayName, username, avatarUrl, email, isAdmin",
    );

    if let user = User.tryFromJson(result.item) {
      return user;
    } else {
      throw httpError.HttpError.notFound("User not found");
    }
  }

  // Intended for admin use only
  pub inflight list(): Array<User> {
    let result = this.table.scan(
      filterExpression: "begins_with(pk, :prefix)",
      expressionAttributeValues: {
        ":prefix": "LOGIN#",
      },
    );

    let var users = MutArray<User>[];

    for item in result.items {
      users.push(User.fromJson(item));
    }

    return users.copy();
  }

  // Intended for admin use only
  pub inflight setAdminRole(options: SetAdminRoleOptions): void {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "LOGIN#{options.username}",
            sk: "#",
          },
          updateExpression: "SET isAdmin = :isAdmin",
          expressionAttributeValues: {
            ":isAdmin": options.isAdmin,
          },
        }
      },
      {
        update: {
          key: {
            pk: "USER#{options.userId}",
            sk: "#",
          },
          updateExpression: "SET isAdmin = :isAdmin",
          expressionAttributeValues: {
            ":isAdmin": options.isAdmin,
          },
        }
      }
    ]);
  }
}
