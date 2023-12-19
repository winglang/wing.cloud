bring util;

struct SignOptions {
  data: Map<str>;
  privateKey: str;
  issuer: str;
}

struct VerifyOptions {
  token: str;
  publicKey: str;
}

pub struct KeyPairResult {
  publicKey: str;
  privateKey: str;
}

pub class KeyPair {
  extern "./src/key-pair.ts" pub static inflight generate(): KeyPairResult;
  extern "./src/key-pair.ts" pub static inflight sign(payload: str, options: SignOptions): str;
  extern "./src/key-pair.ts" pub static inflight verify(options: VerifyOptions): Map<str>?;
}
