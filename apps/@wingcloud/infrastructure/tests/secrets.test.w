bring util;
bring ex;
bring "../crypto/icrypto.w" as icrypto;
bring "../crypto/crypto.w" as crypto;
bring "../secrets.w" as Secrets;

let table = new ex.DynamodbTable(
  name: "data",
  attributeDefinitions: {
    "pk": "S",
    "sk": "S",
  },
  hashKey: "pk",
  rangeKey: "sk",
);

let secrets = new Secrets.Secrets(table);

test "not storing sensitive data" {
  let secret = secrets.create(appId: "app-id", name: "test-secret", value: "secret-value");
  let item = table.getItem(key: {
    pk: "SECRET#${secret.id}",
    sk: "#",
  });
  let encryptedData = icrypto.EncryptedData.fromJson(item.item?.get("value"));

  assert(secret.value != encryptedData.data.text);
}

test "can store and list secrets by app" {
  let secret1 = secrets.create(appId: "app-id", name: "test-secret", value: "secret-value");
  let secret2 = secrets.create(appId: "app-id", name: "test-secret-2", value: "secret-value-2");
  let storedSecret = secrets.get(id: secret1.id);
  let expected1 = Secrets.Secret{
    id: secret1.id,
    appId: "app-id",
    name: "test-secret",
    value: "secret-value",
    createdAt: secret1.createdAt,
    updatedAt: secret1.updatedAt,
    environmentId: nil
  };
  let expected2 = Secrets.Secret{
    id: secret2.id,
    appId: "app-id",
    name: "test-secret-2",
    value: "secret-value-2",
    createdAt: secret2.createdAt,
    updatedAt: secret2.updatedAt,
    environmentId: nil
  };
  
  assert(storedSecret == expected1);

  let storedSecrets = secrets.list(appId: "app-id");
  assert(storedSecrets.length == 2);
  for secret in storedSecrets {
    if secret.id == secret1.id {
      assert(secret == expected1);
    } elif secret.id == secret2.id {
      assert(secret == expected2);
    } else {
      assert(false);
    }
  }
}

test "can store and list secrets by environment" {
  let secret1 = secrets.create(appId: "app-id", environmentId: "env-id", name: "test-secret", value: "secret-value");
  let secret2 = secrets.create(appId: "app-id", environmentId: "env-id", name: "test-secret-2", value: "secret-value-2");
  let secret3 = secrets.create(appId: "app-id", environmentId: "env-id-2", name: "test-secret-3", value: "secret-value-3");
  let secret4 = secrets.create(appId: "app-id", name: "test-secret-4", value: "secret-value-4");
  
  let expected1 = Secrets.Secret{
    id: secret1.id,
    appId: "app-id",
    environmentId: "env-id",
    name: "test-secret",
    value: "secret-value",
    createdAt: secret1.createdAt,
    updatedAt: secret1.updatedAt,
  };
  let expected2 = Secrets.Secret{
    id: secret2.id,
    appId: "app-id",
    environmentId: "env-id",
    name: "test-secret-2",
    value: "secret-value-2",
    createdAt: secret2.createdAt,
    updatedAt: secret2.updatedAt,
  };
  
  let storedSecrets = secrets.listByEnvironment(environmentId: "env-id");
  assert(storedSecrets.length == 2);
  for secret in storedSecrets {
    if secret.id == secret1.id {
      assert(secret == expected1);
    } elif secret.id == secret2.id {
      assert(secret == expected2);
    } else {
      assert(false);
    }
  }
}
