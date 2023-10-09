bring util;
bring "./github.w" as GitHub;

struct SignOptions {
  secret: str;
  userId: str;
  tokens: GitHub.AuthTokens;
}

struct VerifyOptions {
  secret: str;
  jwt: str;
}

struct JWTPayload {
  userId: str;
  tokens: GitHub.AuthTokens;
}

class JWT {
  extern "./jwt.ts" pub static inflight sign(options: SignOptions): str;
  extern "./jwt.ts" pub static inflight verify(options: VerifyOptions): JWTPayload;
}
