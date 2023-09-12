test "will succeed" {
  log("will succeed first log");
  assert(1 == 1);
  log("will succeed second log");
}

test "will succeed 2" {
  assert(2 == 2);
}

test "will fail" {
  log("will fail log");
  assert(1 == 2);
}
