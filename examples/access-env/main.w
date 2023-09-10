bring util;

let token = util.tryEnv("GITHUB_TOKEN");
let path = util.tryEnv("PATH");

test "access-token" {
  assert(token == nil);
  if let path = path {
    assert(path.contains("/special-path"));
  } else {
    assert(false);
  }
}
