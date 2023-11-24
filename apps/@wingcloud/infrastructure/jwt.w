bring util;
bring "./github.w" as GitHub;

struct SignOptions {
  secret: str;
  userId: str;
  username: str;
  accessToken: str;
  accessTokenExpiresIn: num;
  refreshToken: str;
  refreshTokenExpiresIn: num;
}

struct VerifyOptions {
  secret: str;
  jwt: str;
}

pub struct JWTPayload {
  userId: str;
  username: str;
  accessToken: str;
  accessTokenExpiresIn: num;
  refreshToken: str;
  refreshTokenExpiresIn: num;
}

pub class JWT {
  extern "./src/jwt.ts" pub static inflight sign(options: SignOptions): str;
  extern "./src/jwt.ts" pub static inflight verify(options: VerifyOptions): JWTPayload;
}
