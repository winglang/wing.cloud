bring util;

struct SignOptions {
  secret: str;
  userId: str;
}

struct VerifyOptions {
  secret: str;
  jwt: str;
}

pub struct JWTPayload {
  userId: str;
}

pub class JWT {
  extern "./src/jwt.ts" pub static inflight sign(options: SignOptions): str;
  extern "./src/jwt.ts" pub static inflight verify(options: VerifyOptions): JWTPayload;
}
