bring ex;
bring "./nanoid62.w" as Nanoid62;
bring "./http-error.w" as httpError;

struct User {
  id: str;
  displayName: str;
  username: str;
  avatarUrl: str;
  email: str?;
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

struct GetUsernameOptions {
  userId: str;
}

struct UpdateOptions {
  userId: str;
  displayName: str;
  avatarUrl: str?;
  email: str?;
}

pub class Users {
  table: ex.DynamodbTable;

  new(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateOptions): User {
    let userId = "user_{Nanoid62.Nanoid62.generate()}";
    log("userId = {userId}");

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
              avatarUrl: options.avatarUrl,
              email: options.email,
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
              avatarUrl: options.avatarUrl,
              email: options.email,
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

  pub inflight update(
    options: UpdateOptions,
  ): User {
    let result = this.table.updateItem(
      key: {
        pk: "USER#{options.userId}",
        sk: "#",
      },
      updateExpression: "SET displayName = :displayName, avatarUrl = :avatarUrl, email = :email",
      expressionAttributeValues: {
        ":displayName": options.displayName,
        ":avatarUrl": options.avatarUrl,
        ":email": options.email
      },
      returnValues: "ALL_NEW",
    );

    return User.fromJson(result.attributes);
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


  pub inflight getOrCreate(options: GetOrCreateOptions): User {
    if let user = this.fromLogin(username: options.username) {
      return this.update(
        userId: user.id,
        displayName: options.displayName,
        avatarUrl: options.avatarUrl,
        email: options.email
      );
    } else {
      return this.create(
        displayName: options.displayName,
        username: options.username,
        avatarUrl: options.avatarUrl,
        email: options.email
      );
    }
  }

  pub inflight get(options: GetUsernameOptions): User {
    let result = this.table.getItem(
      key: {
        pk: "USER#{options.userId}",
        sk: "#",
      },
      projectionExpression: "id, displayName, username, avatarUrl",
    );

    if let user = User.tryFromJson(result.item) {
      return user;
    } else {
      throw httpError.HttpError.notFound("User not found");
    }
  }
}
