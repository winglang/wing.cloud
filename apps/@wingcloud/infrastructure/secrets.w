bring ex;
bring "./nanoid62.w" as nanoid62;
bring "./crypto/crypto.w" as crypto;
bring "./crypto/icrypto.w" as icrypto;

pub struct Secret {
  id: str;
  appId: str;
  environmentType: str;
  name: str;
  value: str;
  createdAt: str;
  updatedAt: str;
}

struct Item extends Secret {
  pk: str;
  sk: str;
}

pub struct CreateSecretOptions {
  appId: str;
  environmentType: str;
  name: str;
  value: str;
}

pub struct GetSecretOptions {
  id: str;
  appId: str;
  environmentType: str;
  decryptValue: bool?;
}

pub struct ListSecretsOptions {
  appId: str;
  environmentType: str;
  decryptValues: bool?;
}

pub class Secrets {
  table: ex.DynamodbTable;
  crypto: crypto.Crypto;
  global: str;

  new(table: ex.DynamodbTable) {
    this.table = table;
    this.crypto = new crypto.Crypto();
    this.global = "global";
  }

  pub inflight create(options: CreateSecretOptions): Secret {
    let createdAt = datetime.utcNow().toIso();
    let secret = Secret {
      id: "secret_${nanoid62.Nanoid62.generate()}",
      appId: options.appId,
      environmentType: options.environmentType,
      name: options.name,
      value: options.value,
      createdAt: createdAt,
      updatedAt: createdAt,
    };

    let item = MutJson {
      pk: "APP#${secret.appId}",
      sk: "SECRET#TYPE#${secret.environmentType}#SECRET#${secret.id}",
      id: secret.id,
      appId: secret.appId,
      environmentType: secret.environmentType,
      name: secret.name,
      value: this.crypto.encrypt(secret.value),
      createdAt: createdAt,
      updatedAt: createdAt,
    };

    this.table.transactWriteItems(transactItems: [
      {
        put: {
          item: Json.deepCopy(item),
          conditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
        },
      },
    ]);

    return secret;
  }

  pub inflight get(options: GetSecretOptions): Secret {
    let result = this.table.getItem(
      key: {
        pk: "APP#${options.appId}",
        sk: "SECRET#TYPE#${options.environmentType}#SECRET#${options.id}",
      },
    );

    if let item = result.item {
      return Secret.fromJson(this.fromDB(item, options.decryptValue ?? false));
    }

    throw "Secret [${options.id}] not found";
  }

  pub inflight list(options: ListSecretsOptions): Array<Secret> {
    let var secrets = MutArray<Secret>[];

    let result = this.table.query(
      keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      expressionAttributeValues: {
        ":pk": "APP#${options.appId}",
        ":sk": "SECRET#TYPE#${options.environmentType}#"
      },
    );

    for item in result.items {
      let secret = Secret.fromJson(this.fromDB(item, options.decryptValues ?? false));
      secrets.push(secret);
    }

    return secrets.copy();
  }

  inflight fromDB(item: Json, decryptValue: bool): Secret {
    let temp = MutJson{
      id: item.get("id").asStr(),
      appId: item.get("appId").asStr(),
      environmentType: item.get("environmentType").asStr(),
      name: item.get("name").asStr(),
      createdAt: item.get("createdAt").asStr(),
      updatedAt: item.get("updatedAt").asStr(),
    };

    if decryptValue {
      temp.set("value", this.crypto.decrypt(icrypto.EncryptedData.fromJson(item.get("value"))));
    } else {
      temp.set("value", "***");
    }
    
    return Secret.fromJson(temp);
  }
}
