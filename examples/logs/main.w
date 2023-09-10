bring cloud;

log("a preflight log");

new cloud.OnDeploy(inflight () => {
  log("a inflight log");
});

test "logs" {
  log("a test log");
}
