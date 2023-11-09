bring "../types/octokit-types.w" as octokit;

pub class Util {
  extern "./octokit.mts" pub static inflight octokit(baseDir: str): octokit.OctoKit;
}
