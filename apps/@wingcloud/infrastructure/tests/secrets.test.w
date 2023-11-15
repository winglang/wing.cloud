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
  let secret = secrets.create(appId: "app-id", environmentType: "production", name: "test-secret", value: "secret-value");
  let item = table.getItem(key: {
    pk: "APP#${secret.appId}",
    sk: "SECRET#TYPE#production#SECRET#${secret.id}",
  });
  let encryptedData = icrypto.EncryptedData.fromJson(item.item?.get("value"));

  assert(secret.value != encryptedData.data.text);
}

test "can store and get a secret" {
  let secret1 = secrets.create(appId: "app-id", environmentType: "production", name: "test-secret-2", value: "secret-value-2");
  let storedSecret1 = secrets.get(appId: "app-id", environmentType: "production", id: secret1.id, decryptValue: true);

  let expected1 = Secrets.Secret{
    id: secret1.id,
    appId: "app-id",
    name: "test-secret-2",
    value: "secret-value-2",
    createdAt: secret1.createdAt,
    updatedAt: secret1.updatedAt,
    environmentType: "production",
  };

  assert(storedSecret1 == expected1);
}

test "can list secrets" {
  let secret1 = secrets.create(appId: "app-id", environmentType: "preview", name: "test-secret", value: "secret-value");
  let secret2 = secrets.create(appId: "app-id", environmentType: "preview", name: "test-secret-2", value: "secret-value-2");
  let secret3 = secrets.create(appId: "app-id", environmentType: "production", name: "test-secret-3", value: "secret-value-3");
  
  let expected1 = Secrets.Secret{
    id: secret1.id,
    appId: "app-id",
    environmentType: "preview",
    name: "test-secret",
    value: "secret-value",
    createdAt: secret1.createdAt,
    updatedAt: secret1.updatedAt,
  };
  let expected2 = Secrets.Secret{
    id: secret2.id,
    appId: "app-id",
    environmentType: "preview",
    name: "test-secret-2",
    value: "secret-value-2",
    createdAt: secret2.createdAt,
    updatedAt: secret2.updatedAt,
  };
  
  // with envType and envId
  let storedSecrets = secrets.list(appId: "app-id", environmentType: "preview", decryptValues: true);
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

test "will not decrypt values by default" {
  let secret1 = secrets.create(appId: "app-id", environmentType: "preview", name: "test-secret", value: "secret-value");
  let storedSecret1 = secrets.get(appId: "app-id", environmentType: "preview", id: secret1.id);
  assert(storedSecret1.value == "***");

  let storedSecrets = secrets.list(appId: "app-id", environmentType: "preview",);
  assert(storedSecrets.at(0).value == "***");
}
