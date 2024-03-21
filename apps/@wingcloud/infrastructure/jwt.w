bring util;

struct SignOptions {
  secret: str;
  userId: str;
  username: str;
  email: str?;
  isAdmin: bool;
  expirationTime: str?;
}

struct VerifyOptions {
  secret: str;
  jwt: str;
}

pub struct JWTPayload {
  userId: str;
  username: str;
  email: str?;
  isAdmin: bool;
}

pub class JWT {
  extern "./src/jwt.ts" pub static inflight sign(options: SignOptions): str;
  extern "./src/jwt.ts" pub static inflight verify(options: VerifyOptions): JWTPayload;
}
