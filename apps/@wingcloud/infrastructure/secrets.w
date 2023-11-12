bring ex;
bring "./nanoid62.w" as nanoid62;
bring "./crypto.w" as crypto;

pub struct Secret {
  id: str;
  appId: str;
  name: str;
  value: str;
  createdAt: str;
  updatedAt: str;
  environmentId: str?;
}

struct Item extends Secret {
  pk: str;
  sk: str;
}

pub struct CreateSecretOptions {
  appId: str;
  name: str;
  value: str;
  environmentId: str?;
}

pub struct GetSecretOptions {
  id: str;
}

pub struct ListSecretsOptions {
  appId: str;
}

pub class Secrets {
  table: ex.DynamodbTable;
  appSecret: str;

  init(table: ex.DynamodbTable, appSecret: str) {
    this.table = table;
    this.appSecret = appSecret;
  }

  pub inflight create(options: CreateSecretOptions): Secret {
    let createdAt = datetime.utcNow().toIso();
    let secret = Secret {
      id: "secret_${nanoid62.Nanoid62.generate()}",
      appId: options.appId,
      name: options.name,
      value: options.value,
      createdAt: createdAt,
      updatedAt: createdAt,
      environmentId: options.environmentId,
    };

    let getItem = (pk: str, sk: str) => {
      let item = MutJson {
        pk: pk,
        sk: sk,
        id: secret.id,
        appId: secret.appId,
        name: secret.name,
        createdAt: createdAt,
        updatedAt: createdAt,
      };

      let encrypted = crypto.encrypt(this.appSecret, secret.value);
      item.set("value", encrypted);

      if let environmentId = secret.environmentId {
        item.set("environmentId", environmentId);
      }

      return item;
    };

    this.table.transactWriteItems(transactItems: [
      {
        put: {
          item: getItem("SECRET#${secret.id}", "#"),
          conditionExpression: "attribute_not_exists(pk)"
        },
      },
      {
        put: {
          item: getItem("APP#${secret.appId}", "SECRET#${secret.id}"),
        },
      },
    ]);

    return secret;
  }

  pub inflight get(options: GetSecretOptions): Secret {
    let result = this.table.getItem(
      key: {
        pk: "SECRET#${options.id}",
        sk: "#",
      },
    );

    if let item = result.item {
      let temp = MutJson{
        id: item.get("id").asStr(),
        appId: item.get("appId").asStr(),
        name: item.get("name").asStr(),
        createdAt: item.get("createdAt").asStr(),
        updatedAt: item.get("updatedAt").asStr(),
        environmentId: item.tryGet("environmentId")?.tryAsStr(),
      };

      temp.set("value", crypto.decrypt(this.appSecret, crypto.EncryptedData.fromJson(item.get("value"))));

      return Secret.fromJson(temp);
    }

    throw "Secret [${options.id}] not found";
  }

  pub inflight list(options: ListSecretsOptions): Array<Secret> {
    let result = this.table.query(
      keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      expressionAttributeValues: {
        ":pk": "APP#${options.appId}",
        ":sk": "SECRET#",
      },
    );
    let var secrets: Array<Secret> = [];
    for item in result.items {
      let temp = MutJson{
        id: item.get("id").asStr(),
        appId: item.get("appId").asStr(),
        name: item.get("name").asStr(),
        createdAt: item.get("createdAt").asStr(),
        updatedAt: item.get("updatedAt").asStr(),
        environmentId: item.tryGet("environmentId")?.tryAsStr(),
      };

      temp.set("value", crypto.decrypt(this.appSecret, crypto.EncryptedData.fromJson(item.get("value"))));

      secrets = secrets.concat([Secret.fromJson(temp)]);
    }

    return secrets;
  }
}
