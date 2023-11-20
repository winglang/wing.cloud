bring "./types/octokit-types.w" as ok;

pub class Util {
  extern "./src/octokit.mts" pub static inflight octokit(baseDir: str): ok.OctoKit;
}
