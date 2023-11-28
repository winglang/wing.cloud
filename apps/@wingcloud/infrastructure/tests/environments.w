bring cloud;
bring util;
bring fs;
bring http;
bring "../octokit.w" as ok;
bring "./dir.w" as dir;
bring "../users.w" as users;
bring "../apps.w" as apps;
bring "../environments.w" as environments;
bring "../types/octokit-types.w" as octokit;
bring "../github-app.w" as github_app;
bring "../cookie.w" as Cookie;
bring "../jwt.w" as JWT;
bring "../components/parameter/iparameter.w" as parameter;

struct EnvironmentsTestProps {
  users: users.Users;
  apps: apps.Apps;
  environments: environments.Environments;
  githubApp: github_app.GithubApp;
  updateGithubWebhook: inflight (): void;
  appSecret: str;
  wingCloudUrl: parameter.IParameter;
  githubToken: str?;
  githubOrg: str?;
  githubUser: str?;
}

struct CreateRepoResult {
  owner: str;
  repo: str;
}

pub class EnvironmentsTest {
  new(props: EnvironmentsTestProps) {
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
      if let githubToken = props.githubToken {
        let octo = ok.octokit(githubToken);
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
      } else {
        log("Skip deleting test repos");
      }
    }) as "delete test repos";

    let createRepo = inflight (octokit: octokit.OctoKit): CreateRepoResult => {
      // create a new repo
      let repoName = "wing-test-{util.nanoid(alphabet: "abcdefghijk0123456789", size: 8)}";

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

      return { repo: repoName, owner: owner };
    };

    new std.Test(inflight () => {
      if let githubToken = props.githubToken {
        props.updateGithubWebhook();
        let octokit = ok.octokit(githubToken);

        // create a new repo
        let repo = createRepo(octokit);

        try {
          let user = props.users.create(displayName: "name", username: "fake-login", avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4");
          let appId = props.apps.create(
            appName: "test-app",
            description: "test app",
            createdAt: "0",
            repoId: "{repo.owner}/{repo.repo}",
            repoName: repo.repo,
            repoOwner: repo.owner,
            userId: user.id,
            entryfile: "main.w"
          );

          // create a PR
          let branchName = "branch-1";
          let ref = octokit.git.getRef(
            owner: repo.owner,
            repo: repo.repo,
            ref: "heads/main"
          );

          if ref.status < 200 || ref.status >= 300 {
            throw "failed to get main ref";
          }

          octokit.git.createRef(
            owner: repo.owner,
            repo: repo.repo,
            ref: "refs/heads/{branchName}",
            sha: ref.data.object.sha,
          );

          for entry in Json.entries(redisExample) {
            octokit.repos.createOrUpdateFileContents(
              owner: repo.owner,
              repo: repo.repo,
              branch: branchName,
              path: entry.key,
              message: "add {entry.key}",
              content: util.base64Encode(entry.value.asStr())
            );
          }

          octokit.pulls.create(
            base: "main",
            head: branchName,
            owner: repo.owner,
            repo: repo.repo,
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

          assert(env.type == "preview");

          // verify tests passed
          assert(env.testResults?.testResults?.length == 1);
          assert(env.testResults?.testResults?.at(0)?.path == "root/Default/test:Hello, world!");
          assert(env.testResults?.testResults?.at(0)?.pass == true);
        } finally {
          octokit.repos.delete(owner: repo.owner, repo: repo.repo);
        }
      } else {
        throw "missing github token";
      }
    }, timeout: 10m) as "create environment from PR";

    new std.Test(inflight () => {
      if let githubToken = props.githubToken {
        props.updateGithubWebhook();
        let token = props.githubApp.createGithubAppJwtToken();
        let appOctokit = ok.octokit(token);
        let octokit = ok.octokit(githubToken);

        // create a new repo
        let repo = createRepo(octokit);

        try {
          // add files to main
          for entry in Json.entries(redisExample) {
            octokit.repos.createOrUpdateFileContents(
              owner: repo.owner,
              repo: repo.repo,
              branch: "main",
              path: entry.key,
              message: "add {entry.key}",
              content: util.base64Encode(entry.value.asStr())
            );
          }

          let user = props.users.create(displayName: "name", username: "fake-login", avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4");

          let jwt = JWT.JWT.sign(
            secret: props.appSecret,
            userId: user.id,
            accessToken: githubToken,
            accessTokenExpiresIn: 1000,
            refreshToken: githubToken,
            refreshTokenExpiresIn: 1000,
          );

          let authCookie = Cookie.Cookie.serialize(
            "auth",
            jwt,
            {
              httpOnly: true,
              secure: true,
              sameSite: "strict",
              path: "/",
              maxAge: 1h.seconds,
            },
          );

          // use app octokit to get the installations
          let res = appOctokit.apps.listInstallations();
          if res.status < 200 || res.status >= 300 {
            throw "failed to get user installations";
          }

          let var installationId: num? = nil;
          for installation in res.data {
            if installation.account.login == repo.owner {
              installationId = installation.id;
            }
          }

          if !installationId? {
            throw "failed to find installation for owner {repo.owner}";
          }

          let createRes = http.post("{props.wingCloudUrl.get()}/wrpc/user.createApp",
            body: Json.stringify({
              default_branch: "main",
              repoId: "{repo.owner}/{repo.repo}",
              repoOwner: repo.owner,
              repoName: repo.repo,
              appName: "test-app",
              entryfile: "main.w",
              installationId: "{installationId}",
            }),
            headers: {
              "cookie": authCookie
            }
          );

          if createRes.status < 200 || createRes.status >= 300 {
            throw "failed to create app {createRes.status} {createRes.body}";
          }

          if let appId = Json.tryParse(createRes.body)?.tryGet("appId")?.tryAsStr() {
            // verify environment created
            let app = props.apps.get(appId: appId);
            let isRunning = util.waitUntil(inflight () => {
              let envs = props.environments.list(appId: app.appId);
              if let env = envs.tryAt(0) {
                if env.status == "running" {
                  return true;
                }
              }

              return false;
            }, timeout: 10m);

            assert(isRunning);

            let env = props.environments.list(appId: app.appId).at(0);
            assert(env.type == "production");
          }
        } finally {
          octokit.repos.delete(owner: repo.owner, repo: repo.repo);
        }
      } else {
        throw "missing github token";
      }
    }, timeout: 1m) as "create production environment for app";
  }
}
