bring "./nanoid62.w" as Nanoid62;
bring "./http-error.w" as httpError;
bring dynamodb;

pub struct User {
  id: str;
  displayName: str?;
  username: str;
  avatarUrl: str;
  email: str?;
  isAdmin: bool?;
  isEarlyAccessUser: bool?; // User is an early access user
  isEarlyAccessCodeRequired: bool?; // User must provide an early access code to sign in
}

struct CreateOptions {
  displayName: str;
  username: str;
  avatarUrl: str?;
  email: str?;
  isEarlyAccessUser: bool?;
  isEarlyAccessCodeRequired: bool?;
}

struct FromLoginOptions {
  username: str;
}

struct GetOrCreateOptions {
  displayName: str;
  username: str;
  avatarUrl: str?;
  email: str?;
  isEarlyAccessUser: bool?;
  isEarlyAccessCodeRequired: bool?;
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
  isEarlyAccessCodeRequired: bool?;
}

struct SetAdminRoleOptions {
  userId: str;
  username: str;
  isAdmin: bool;
}

struct SetIsEarlyAccessUserOptions {
  userId: str;
  username: str;
  isEarlyAccessUser: bool;
  isEarlyAccessCodeRequired: bool;
}

struct SetEarlyAccessCodeRequiredOptions {
  userId: str;
  username: str;
  isEarlyAccessCodeRequired: bool;
}

pub class Users {
  table: dynamodb.Table;

  new(table: dynamodb.Table) {
    this.table = table;
  }

  pub inflight create(options: CreateOptions): User {
    let userId = "user_{Nanoid62.Nanoid62.generate()}";

    this.table.transactWrite(
      TransactItems: [
        {
          Put: {
            Item: {
              pk: "LOGIN#{options.username}",
              sk: "#",
              id: userId,
              displayName: options.displayName,
              username: options.username,
              avatarUrl: options.avatarUrl ?? "",
              email: options.email ?? "",
              isEarlyAccessUser: options.isEarlyAccessUser ?? false,
              isEarlyAccessCodeRequired: options.isEarlyAccessCodeRequired ?? false,
            },
            ConditionExpression: "attribute_not_exists(pk)",
          },
        },
        {
          Put: {
            Item: {
              pk: "USER#{userId}",
              sk: "#",
              id: userId,
              displayName: options.displayName,
              username: options.username,
              avatarUrl: options.avatarUrl ?? "",
              email: options.email ?? "",
              isEarlyAccessUser: options.isEarlyAccessUser ?? false,
              isEarlyAccessCodeRequired: options.isEarlyAccessCodeRequired ?? false,
            },
          }
        },
      ],
    );

    return User {
      id: userId,
      displayName: options.displayName,
      username: options.username,
      avatarUrl: options.avatarUrl ?? "",
      email: options.email ?? "",
      isEarlyAccessUser: options.isEarlyAccessUser,
      isEarlyAccessCodeRequired: options.isEarlyAccessCodeRequired ?? false,
    };
  }

  pub inflight update(options: UpdateOptions): void {
    this.table.transactWrite(TransactItems: [
      {
        Update: {
          Key: {
            pk: "LOGIN#{options.username}",
            sk: "#",
          },
          UpdateExpression: "SET displayName = :displayName, avatarUrl = :avatarUrl, email = :email, isEarlyAccessCodeRequired = :isEarlyAccessCodeRequired",
          ExpressionAttributeValues: {
            ":displayName": options.displayName,
            ":avatarUrl": options.avatarUrl,
            ":email": options.email,
            ":isEarlyAccessCodeRequired": options.isEarlyAccessCodeRequired,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "USER#{options.userId}",
            sk: "#",
          },
          UpdateExpression: "SET displayName = :displayName, avatarUrl = :avatarUrl, email = :email, isEarlyAccessCodeRequired = :isEarlyAccessCodeRequired",
          ExpressionAttributeValues: {
            ":displayName": options.displayName,
            ":avatarUrl": options.avatarUrl,
            ":email": options.email,
            ":isEarlyAccessCodeRequired": options.isEarlyAccessCodeRequired,
          },
        }
      }
    ]);
  }

  pub inflight fromLogin(options: FromLoginOptions): User? {
    let result = this.table.get(
      Key: {
        pk: "LOGIN#{options.username}",
        sk: "#",
      },
    );
    if let item = result.Item {
      return this.fromDB(item);
    }
    return nil;
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
        user.isEarlyAccessCodeRequired == options.isEarlyAccessCodeRequired &&
        user.email == options.email {
          return user;
      }

      this.update(
        userId: user.id,
        displayName: options.displayName,
        avatarUrl: options.avatarUrl,
        email: options.email,
        username: options.username,
        isEarlyAccessCodeRequired: options.isEarlyAccessCodeRequired,
      );

      return User {
        username: options.username,
        avatarUrl: options.avatarUrl ?? "",
        displayName: options.displayName,
        email: options.email,
        id: user.id,
        isAdmin: user.isAdmin,
        isEarlyAccessCodeRequired: options.isEarlyAccessCodeRequired,
      };
    } else {
      return this.create(
        displayName: options.displayName,
        username: options.username,
        avatarUrl: options.avatarUrl,
        email: options.email,
        isEarlyAccessUser: options.isEarlyAccessUser ?? false,
        isEarlyAccessCodeRequired: options.isEarlyAccessCodeRequired ?? false,
      );
    }
  }

  pub inflight get(options: GetUserOptions): User {
    let result = this.table.get(
      Key: {
        pk: "USER#{options.userId}",
        sk: "#",
      },
      ProjectionExpression: "id, displayName, username, avatarUrl, email, isAdmin, isEarlyAccessUser",
    );

    if let item = result.Item {
      return this.fromDB(item);
    } else {
      throw httpError.HttpError.notFound("User not found");
    }
  }

  pub inflight getByName(options: GetUserByNameOptions): User {
    let result = this.table.get(
      Key: {
        pk: "LOGIN#{options.username}",
        sk: "#",
      },
      ProjectionExpression: "id, displayName, username, avatarUrl, email, isAdmin",
    );

    if let item = result.Item {
      return this.fromDB(item);
    } else {
      throw httpError.HttpError.notFound("User not found");
    }
  }

  // Intended for admin use only
  pub inflight list(): Array<User> {
    let result = this.table.scan(
      FilterExpression: "begins_with(pk, :prefix)",
      ExpressionAttributeValues: {
        ":prefix": "LOGIN#",
      },
    );

    let var users = MutArray<User>[];

    for item in result.Items {
      users.push(this.fromDB(item));
    }
      return users.copy();
  }

  // Intended for admin use only
  pub inflight setAdminRole(options: SetAdminRoleOptions): void {
    this.table.transactWrite(TransactItems: [
      {
        Update: {
          Key: {
            pk: "LOGIN#{options.username}",
            sk: "#",
          },
          UpdateExpression: "SET isAdmin = :isAdmin",
          ExpressionAttributeValues: {
            ":isAdmin": options.isAdmin,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "USER#{options.userId}",
            sk: "#",
          },
          UpdateExpression: "SET isAdmin = :isAdmin",
          ExpressionAttributeValues: {
            ":isAdmin": options.isAdmin,
          },
        }
      }
    ]);
  }

  // Intended for admin use only
  pub inflight setIsEarlyAccessUser(options: SetIsEarlyAccessUserOptions): void {
    this.table.transactWrite(TransactItems: [
      {
        Update: {
          Key: {
            pk: "LOGIN#{options.username}",
            sk: "#",
          },
          UpdateExpression: "SET isEarlyAccessUser = :isEarlyAccessUser, isEarlyAccessCodeRequired = :isEarlyAccessCodeRequired",
          ExpressionAttributeValues: {
            ":isEarlyAccessUser": options.isEarlyAccessUser,
            ":isEarlyAccessCodeRequired": options.isEarlyAccessCodeRequired,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "USER#{options.userId}",
            sk: "#",
          },
          UpdateExpression: "SET isEarlyAccessUser = :isEarlyAccessUser, isEarlyAccessCodeRequired = :isEarlyAccessCodeRequired",
          ExpressionAttributeValues: {
            ":isEarlyAccessUser": options.isEarlyAccessUser,
            ":isEarlyAccessCodeRequired": options.isEarlyAccessCodeRequired,
          },
        }
      }
    ]);
  }

  inflight fromDB(item: Json): User {
    return {
      id: item.get("id").asStr(),
      username: item.get("username").asStr(),
      avatarUrl: item.tryGet("avatarUrl")?.tryAsStr() ?? "",
      displayName: item.tryGet("displayName")?.tryAsStr() ?? "",
      email: item.tryGet("email")?.tryAsStr() ?? "",
      isAdmin: item.tryGet("isAdmin")?.tryAsBool() ?? false,
      isEarlyAccessUser: item.tryGet("isEarlyAccessUser")?.tryAsBool() ?? false,
      isEarlyAccessCodeRequired: item.tryGet("isEarlyAccessCodeRequired")?.tryAsBool(),
    };
  }
}
