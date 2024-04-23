bring ex;
bring util;
bring "./nanoid62.w" as Nanoid62;
bring "./http-error.w" as httpError;

pub struct EarlyAccessItem {
  id: str;
  description: str?;
  code: str;
  createdAt: str;
  expiresAt: str;
  used: bool;
}

struct CreateOptions {
  description: str?;
}

struct GetOptions {
  code: str;
}

struct DeleteOptions {
  code: str;
}

struct ValidateOptions {
  code: str;
}

class Util {
  extern "./util.js" pub static inflight addMiliseconds(date:str, ms: num): str;
}

pub class EarlyAccess {
  table: ex.DynamodbTable;
  expirationTime: num;

  new(table: ex.DynamodbTable) {
    this.table = table;
    this.expirationTime = 1000 * 60 * 60 * 24 * 7; // 7 days
  }

  pub inflight createCode(options: CreateOptions): EarlyAccessItem {
    let id = "early_access_{Nanoid62.Nanoid62.generate()}";

    let code = util.uuidv4();
    let createdAt = datetime.utcNow().toIso();
    let expiresAt = Util.addMiliseconds(createdAt, this.expirationTime);


    try {
      this.table.transactWriteItems(transactItems: [
        {
          put: {
            item: Json.deepCopy({
              pk: "EARLY_ACCESS#{code}",
              sk: "#",
              id: id,
              code: code,
              description: options.description,
              createdAt: createdAt,
              expiresAt: expiresAt,
              used: false,
            }),
            conditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
          },
        },
      ]);
    } catch error {
      throw httpError.HttpError.error(error);
    }
    return EarlyAccessItem {
      id: id,
      code: code,
      description: options.description,
      createdAt: createdAt,
      expiresAt: "",
      used: false,
    };
  }

  pub inflight validateCode(options: ValidateOptions): void {
    let now = datetime.utcNow();

    let result = this.table.getItem(
      key: {
        pk: "EARLY_ACCESS#{options.code}",
        sk: "#",
      },
      projectionExpression: "id, description, code, createdAt, expiresAt, used",
    );

    if let item = EarlyAccessItem.tryFromJson(result.item) {
      if item.code != options.code {
        throw httpError.HttpError.badRequest("The provided code is invalid");
      } if item.used {
        throw httpError.HttpError.badRequest("Code already used");
      } if datetime.fromIso(item.expiresAt).timestamp < now.timestamp {
        throw httpError.HttpError.forbidden("Code expired");
      }

      this.table.updateItem(
        key: {
          pk: "EARLY_ACCESS#{options.code}",
          sk: "#",
        },
        updateExpression: "SET used = :used",
        expressionAttributeValues: {
          ":used": true,
        },
      );
      return;
    }
    throw httpError.HttpError.notFound("The provided code is invalid");
  }

  pub inflight deleteCode(options: DeleteOptions) {
    this.table.deleteItem(
      key: {
        pk: "EARLY_ACCESS#{options.code}",
        sk: "#",
      },
    );
  }

  pub inflight listCodes(): Array<EarlyAccessItem> {
    let result = this.table.scan(
      filterExpression: "begins_with(pk, :prefix)",
      expressionAttributeValues: {
        ":prefix": "EARLY_ACCESS#",
      },
    );

    let var users = MutArray<EarlyAccessItem>[];

    for item in result.items {
      users.push(EarlyAccessItem.fromJson(item));
    }

    return users.copy();
  }
}
