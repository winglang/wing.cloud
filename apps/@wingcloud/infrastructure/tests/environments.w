bring cloud;
bring util;
bring fs;
bring http;
bring "./octokit.w" as ok;
bring "./dir.w" as dir;
bring "../users.w" as users;
bring "../apps.w" as apps;
bring "../environments.w" as environments;
bring "../types/octokit-types.w" as octokit;

struct EnvironmentsTestProps {
  users: users.Users;
  apps: apps.Apps;
  environments: environments.Environments;
  githubToken: str;
  githubOrg: str?;
  githubUser: str?;
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

    let redisExample = readdirContents(fs.join(dir.dirname(), "../../../../examples/redis"));

    new cloud.Function(inflight () => {
      let octo = ok.octokit(props.githubToken);
      let var owner = "";
      let var response: octokit.ListReposResponse? = nil;
      if let org = props.githubOrg {
        owner = org;
        response = octo.repos.listForOrg(org: owner);
      } elif let user = props.githubUser {
        owner = user;
        response = octo.repos.listForAuthenticatedUser(type: "owner");
      } else {
        throw "missing github owner";
      }

      if let res = response {
        if res.status >= 200 && res.status < 300 {
          for repo in res.data {
            let repoName = repo.full_name.split("/").at(1);
            if repoName.startsWith("wing-test-") {
              octo.repos.delete(owner: owner, repo: repoName);
            }
          }
        }
      }
    }) as "delete test repos";

    new std.Test(inflight () => {
      let octokit = ok.octokit(props.githubToken);

      // create a new repo
      let repoName = "wing-test-${util.nanoid(alphabet: "abcdefghijk0123456789", size: 8)}";

      let var owner = "";
      let var isOrg = true;
      if let org = props.githubOrg {
        let res = octokit.repos.createInOrg(name: repoName, org: org, private: true, auto_init: true);
        assert(res.status >= 200 && res.status < 300);
        owner = org;
      } elif let user = props.githubUser {
        let res = octokit.repos.createForAuthenticatedUser(name: repoName, private: true, auto_init: true);
        assert(res.status >= 200 && res.status < 300);
        owner = user;
        isOrg = false;
      } else {
        throw "missing github owner";
      }

      try {
        let userId = props.users.create(gitHubLogin: "fake-login");
        let appId = props.apps.create(
          name: "test-app",
          createdAt: "0",
          createdBy: userId,
          repoId: "${owner}/${repoName}",
          repoName: repoName,
          repoOwner: owner,
          userId: userId,
          entryfile: "main.w"
        );

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
          let envs = props.environments.list(appId: appId);
          if let env = envs.tryAt(0) {
            if env.status == "running" {
              return true;
            }
          }

          return false;
        }, timeout: 10m);

        assert(isRunning);

        // make sure its responding
        let env = props.environments.list(appId: appId).at(0);
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
        octokit.repos.delete(owner: owner, repo: repoName);
      }
    }, timeout: 10m) as "create environment from PR";
  }
}
