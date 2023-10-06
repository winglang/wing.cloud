bring util;

struct SerializeOptions {
  domain: str?;
  // encode: inflight (str): str?;
  expires: num?;
  httpOnly: bool?;
  maxAge: num?;
  path: str?;
  sameSite: str?;
  secure: bool?;
}

class Cookie {
  extern "cookie" pub static inflight parse(value: str): Map<str>;
  extern "cookie" pub static inflight serialize(name: str, value: str, options: SerializeOptions?): str;
}
