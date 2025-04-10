bring util;

struct SerializeOptions {
  domain: str?;
  expires: num?;
  httpOnly: bool?;
  maxAge: num?;
  path: str?;
  sameSite: str?;
  secure: bool?;
}

pub class Cookie {
  extern "./src/cookie.js" pub static inflight parse(value: str): Map<str>;
  extern "./src/cookie.js" pub static inflight serialize(name: str, value: str, options: SerializeOptions?): str;
}
