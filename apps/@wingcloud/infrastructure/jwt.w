bring util;
bring "./github.w" as GitHub;

struct SignOptions {
  secret: str;
  userId: str;
  accessToken: str;
  accessTokenExpiresIn: num;
  refreshToken: str;
  refreshTokenExpiresIn: num;
}

struct VerifyOptions {
  secret: str;
  jwt: str;
}

struct JWTPayload {
  userId: str;
  accessToken: str;
  accessTokenExpiresIn: num;
  refreshToken: str;
  refreshTokenExpiresIn: num;
}

class JWT {
  extern "./src/jwt.ts" pub static inflight sign(options: SignOptions): str;
  extern "./src/jwt.ts" pub static inflight verify(options: VerifyOptions): JWTPayload;
}
