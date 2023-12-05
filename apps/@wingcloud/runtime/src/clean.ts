export const cleanEnvironment = function () {
  const allowedEnvVars = new Set([
    "PATH",
    "PWD",
    "HOME",
    "TMPDIR",
    "LANG",
    "USER",
    "GIT_TOKEN",
    "ENVIRONMENT_ID",
  ]);
  for (let env in process.env) {
    if (!allowedEnvVars.has(env)) {
      delete process.env[env];
    }
  }
};
