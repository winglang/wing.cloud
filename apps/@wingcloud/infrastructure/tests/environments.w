bring util;
bring fs;
bring http;
bring "./git.w" as gits;
bring "./dir.w" as dir;
bring "../users.w" as users;
bring "../projects.w" as projects;
bring "../environments.w" as environments;

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
    
    // let writedirContents = inflight (path: str, dirContents: Json) => {
    //   for entry in Json.entries(dirContents) {
    //     fs.writeFile(fs.join(path, entry.key), entry.value.asStr());
    //   }
    // };
      
    let githubToken = util.env("TESTS_GITHUB_TOKEN");
    let githubOrg = util.tryEnv("TESTS_GITHUB_ORG");
    let githubUser = util.tryEnv("TESTS_GITHUB_USER");
      
    let redisExample = readdirContents(fs.join(dir.dirname(), "../../../../examples/redis"));
    
    new std.Test(inflight () => {
      let octokit = gits.octokit(githubToken);
      
      // octokit.repos.delete(owner: "eladcon", repo: "cf3d7k41");
      // octokit.repos.delete(owner: "eladcon", repo: "j65aahhk");
      // octokit.repos.delete(owner: "eladcon", repo: "75hfe9ga");
      // octokit.repos.delete(owner: "eladcon", repo: "kbaf82c8");
      // octokit.repos.delete(owner: "eladcon", repo: "3jdiki2k");
      // octokit.repos.delete(owner: "eladcon", repo: "2d462c8f");
      // octokit.repos.delete(owner: "eladcon", repo: "9i48c1dk");
      // octokit.repos.delete(owner: "eladcon", repo: "d10g7b1k");


      // create a new repo
      let repoName = util.nanoid(alphabet: "abcdefghijk0123456789", size: 8);
      let var owner = "";
      if let org = githubOrg {
        let res = octokit.repos.createInOrg(name: repoName, org: org, private: true, auto_init: true);
        assert(res.status >= 200 && res.status < 300);
        owner = org;
      } elif let user = githubUser {
        let res = octokit.repos.createForAuthenticatedUser(name: repoName, private: true, auto_init: true);
        assert(res.status >= 200 && res.status < 300);
        owner = githubUser ?? "";
      } else {
        throw "missing github owner";
      }
    
      try {
        // let tmpdir = fs.mkdtemp("source-");
        // let g = gits.simpleGit(tmpdir);
        // g.clone("https://github.com/${owner}/${repoName}.git", tmpdir);
        // g.checkoutLocalBranch("branch-1");
        
        // // create a PR
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

        // writedirContents(tmpdir, redisExample);
        // g.add(["."]);
        // g.commit("add files");
        // g.push("origin", "branch-1");

        let userId = props.users.create(gitHubLogin: "fake-login");
        let project = props.projects.create(name: "test-project", repository: "${owner}/${repoName}", userId: userId, entryfile: "main.w");

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

        // make sure its running
        let env = props.environments.list(projectId: project.id).at(0);
        if let url = env.url {
          util.waitUntil(inflight () => {
            let res = http.get(url);
            return res.ok;
          });
        } else {
          log("missing environment url");
          assert(false);
        }

        if let testResults = env.testResults {
          for testResult in testResults.data.testResults {
            log("checking test ${testResult.path}");
            assert(testResult.pass);
          }
        } else {
          log("missing test results");
          assert(false);
        }
      } finally {
        // delete the repo
        octokit.repos.delete(owner: owner, repo: repoName);
        // util.sleep(20s);
      }
    }, timeout: 10m);
  }
}
