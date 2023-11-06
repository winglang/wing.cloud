bring util;
bring fs;
bring http;
bring "./git.w" as gits;
bring "./dir.w" as dir;
bring "../users.w" as users;
bring "../projects.w" as projects;
bring "../environments.w" as environments;
bring "../types/octokit-types.w" as octokit;

struct EnvironmentsTestProps {
  users: users.Users;
  projects: projects.Projects;
  environments: environments.Environments;
}

pub class EnvironmentsTest {
  init(props: EnvironmentsTestProps) {
    let readdirContents = (path: str): Json => {
      let dirContents = MutJson{};
      for file in fs.readdir(path) {
        let contents = fs.readFile(fs.join(path, file), encoding: "utf8");
        dirContents.set(file, contents);
      }
      return dirContents;
    };
      
    let githubToken = util.env("TESTS_GITHUB_TOKEN");
    let githubOrg = util.tryEnv("TESTS_GITHUB_ORG");
    let githubUser = util.tryEnv("TESTS_GITHUB_USER");
      
    let redisExample = readdirContents(fs.join(dir.dirname(), "../../../../examples/redis"));

    let deleteRepo = inflight (octokit: octokit.OctoKit, repo: str, owner: str) => {
      try {
        octokit.repos.delete(owner: owner, repo: repo);
      } catch {}
    };
    
    new std.Test(inflight () => {
      let octokit = gits.octokit(githubToken);

      // create a new repo
      let repoName = "wing-test-env-creation-pr";

      let var owner = "";
      if let org = githubOrg {
        deleteRepo(octokit, repoName, org);
        let res = octokit.repos.createInOrg(name: repoName, org: org, private: true, auto_init: true);
        assert(res.status >= 200 && res.status < 300);
        owner = org;
      } elif let user = githubUser {
        deleteRepo(octokit, repoName, githubUser ?? "");
        let res = octokit.repos.createForAuthenticatedUser(name: repoName, private: true, auto_init: true);
        assert(res.status >= 200 && res.status < 300);
        owner = githubUser ?? "";
      } else {
        throw "missing github owner";
      }
    
      try {
        let userId = props.users.create(gitHubLogin: "fake-login");
        let project = props.projects.create(name: "test-project", repository: "${owner}/${repoName}", userId: userId, entryfile: "main.w");

        // create a PR
        let branchName = "branch-1";
        let ref = octokit.git.getRef(
          owner: owner,
          repo: repoName,
          ref: "heads/main"
        );

        if ref.status < 200 || ref.status >= 300 {
          throw "failed to get main ref";
        }

        octokit.git.createRef(
          owner: owner,
          repo: repoName,
          ref: "refs/heads/${branchName}",
          sha: ref.data.object.sha,
        );

        for entry in Json.entries(redisExample) {
          octokit.repos.createOrUpdateFileContents(
            owner: owner,
            repo: repoName,
            branch: branchName,
            path: entry.key,
            message: "add ${entry.key}",
            content: util.base64Encode(entry.value.asStr())
          );
        }

        octokit.pulls.create(
          base: "main",
          head: branchName,
          owner: owner,
          repo: repoName,
          title: "Test Changes"
        );
        
        // verify environment created
        let isRunning = util.waitUntil(inflight () => {
          let envs = props.environments.list(projectId: project.id);
          if let env = envs.tryAt(0) {
            if env.status == "running" {
              return true;
            }
          }

          return false;
        }, timeout: 10m);
        
        assert(isRunning);

        // make sure its responding
        let env = props.environments.list(projectId: project.id).at(0);
        if let url = env.url {
          util.waitUntil(inflight () => {
            try {
              let res = http.get(url);
              return res.ok;
            } catch {
              return false;
            }
          });
        } else {
          log("missing environment url");
          assert(false);
        }

        // verify tests passed
        assert(env.testResults?.data?.testResults?.length == 1);
        assert(env.testResults?.data?.testResults?.at(0)?.path == "root/Default/test:Hello, world!");
        assert(env.testResults?.data?.testResults?.at(0)?.pass == true);
      } finally {
        deleteRepo(octokit, repoName, owner);
      }
    }, timeout: 10m) as "create environment from PR";
  }
}
