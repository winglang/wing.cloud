bring "./crypto.w" as crypto;

let c = new crypto.Crypto();

test "can encrypt and decrypt data" {
  let encrypted = c.encrypt("test string");
  log("${Json.stringify(encrypted)}");

  let decrypted = c.decrypt(encrypted);
  assert(decrypted == "test string");
}
