bring util;

test "access-token" {
  let token = util.tryEnv("GITHUB_TOKEN");
  assert(token == nil);
}
