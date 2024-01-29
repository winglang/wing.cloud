import {
  MonorepoProject,
  TypescriptProject,
  NodeEsmProject,
  NodeProject,
  TypescriptConfig,
  Eslint,
  Turbo,
} from "@skyrpex/wingen";

///////////////////////////////////////////////////////////////////////////////
interface WingLibProjectOptions {
  readonly monorepo: MonorepoProject;
  readonly name: string;
  readonly outdir?: string;
  readonly deps?: string[];
  readonly devDeps?: string[];
  readonly typescript?: boolean;
}

class WingLibProject extends NodeProject {
  constructor(options: WingLibProjectOptions) {
    super({
      outdir: `packages/${options.name}`,
      ...options,
      parent: options.monorepo,
    });

    this.addFields({
      type: "module",
    });

    if (options.typescript) {
      new TypescriptConfig(this, {
        include: ["src/**/*"],
      });
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
const monorepo = new MonorepoProject({
  devDeps: ["@skyrpex/wingen"],
  name: "@wingcloud/monorepo",
});

monorepo.devTask.reset("turbo dev --concurrency 12");

///////////////////////////////////////////////////////////////////////////////
const wrpc = new TypescriptProject({
  monorepo,
  name: "@wingcloud/wrpc",
  devDeps: ["react", "@types/react", "@tanstack/react-query"],
  peerDeps: ["react", "@tanstack/react-query"],
});
wrpc
  .tryFindObjectFile("tsconfig.json")!
  .addToArray("compilerOptions.lib", "DOM", "DOM.Iterable");

///////////////////////////////////////////////////////////////////////////////
const probot = new WingLibProject({
  monorepo,
  name: "@wingcloud/probot",
  devDeps: ["@probot/adapter-aws-lambda-serverless"],
  typescript: true,
});

///////////////////////////////////////////////////////////////////////////////
const nanoid = new WingLibProject({
  monorepo,
  name: "@wingcloud/nanoid",
});

///////////////////////////////////////////////////////////////////////////////
const dateutils = new WingLibProject({
  monorepo,
  name: "@wingcloud/dateutils",
});

///////////////////////////////////////////////////////////////////////////////
const simutils = new WingLibProject({
  monorepo,
  name: "@wingcloud/simutils",
  deps: ["get-port"],
});

///////////////////////////////////////////////////////////////////////////////
const ngrok = new WingLibProject({
  monorepo,
  name: "@wingcloud/ngrok",
  deps: [simutils.name],
});

///////////////////////////////////////////////////////////////////////////////
const containers = new WingLibProject({
  monorepo,
  name: "@wingcloud/containers",
  devDeps: [nanoid.name],
});

///////////////////////////////////////////////////////////////////////////////
const vite = new NodeEsmProject({
  monorepo,
  name: "@wingcloud/vite",
});
vite.addFields({ types: "./src/index.d.ts" });

vite.addDevDeps("vite");
vite.addDeps("dotenv");

///////////////////////////////////////////////////////////////////////////////
const website = new NodeProject({
  parent: monorepo,
  name: "@wingcloud/website",
  outdir: "apps/@wingcloud/website",
});
website.addDevDeps("typescript", "@types/node@20");
new TypescriptConfig(website, {
  include: ["src/**/*"],
});
new Eslint(website);

new Turbo(website, {
  pipeline: {
    compile: {
      dotEnv: [".env"],
      outputs: ["dist/**"],
    },
  },
});

website.addDeps("vite");
website.addScript("compile", "vite build");
website.addGitIgnore("/dist/");
website.addGitIgnore("/public/wing.js");

website.addDevDeps("@vitejs/plugin-react-swc");
website.addDeps("react", "react-dom");
website.addDevDeps("@types/react", "@types/react-dom");

website.addDeps("react-router-dom");
website.addDeps("react-error-boundary");

website.addDevDeps(vite.name);

website.addDevDeps("tsx", "get-port", "zod");
website.addDeps(wrpc.name);
website.addDeps("@tanstack/react-query");
website.addDeps("clsx");
website.addDeps("@headlessui/react");
website.addDeps("@heroicons/react");
website.addDeps("react-popper");
website.addDeps("@wingconsole/ui");
website.addDeps("@segment/analytics-next");

website.addDevDeps("tailwindcss", "postcss", "autoprefixer");

website.addDevDeps("@aws-sdk/client-dynamodb");
website.addGitIgnore("/.wingcloud/");

website.addGitIgnore("/.env");
website.addGitIgnore("/.env.*");
website.addGitIgnore("!/.env.example");

{
  const tsconfig = website.tryFindObjectFile("tsconfig.json")!;
  tsconfig.addOverride("compilerOptions.jsx", "react-jsx");
  tsconfig.addToArray("compilerOptions.lib", "DOM", "DOM.Iterable");
  tsconfig.addToArray("include", "plugins/**/*", ".wingcloud/**/*");
}

website.addDevDeps("node-fetch");
website.addDevDeps("nanoid");
website.addDevDeps("@ibm/plex");

///////////////////////////////////////////////////////////////////////////////
const runtime = new TypescriptProject({
  monorepo,
  name: "@wingcloud/runtime",
  outdir: "apps/@wingcloud/runtime",
  tsup: {
    entry: ["src/**/*.ts"],
    outDir: "lib",
    format: ["esm"],
    target: "node20",
    dts: true,
    bundle: false,
    clean: true,
  },
});

runtime.devTask.exec(`tsup --watch --onSuccess "node lib/entrypoint-local.js"`);

runtime.addDeps("winglang");
runtime.addDeps("@winglang/sdk");
runtime.addDeps("@winglang/compiler");
runtime.addDeps("@wingconsole/app");
runtime.addDeps("express");
runtime.addDeps("http-proxy");
runtime.addDeps("jsonwebtoken");
runtime.addDeps("jose");
runtime.addDeps("node-fetch");
runtime.addDeps("which");
runtime.addDeps("redact-env");
runtime.addDeps("codespan-wasm");
runtime.addDeps("chalk");
runtime.addDeps("stacktracey");
runtime.addDeps("chokidar");

runtime.addDevDeps("@types/express");
runtime.addDevDeps("@types/http-proxy");
runtime.addDevDeps("@types/jsonwebtoken");
runtime.addDevDeps("simple-git");
runtime.addDevDeps("msw@1");
runtime.addDevDeps("@types/which");

runtime.addGitIgnore("target/");

///////////////////////////////////////////////////////////////////////////////

const platform = new TypescriptProject({
  monorepo,
  name: "@wingcloud/platform",
  outdir: "packages/@wingcloud/platform",
  tsup: {
    entry: ["src/**/*.ts"],
    outDir: "lib",
    format: ["cjs"],
    target: "node18",
    dts: true,
    bundle: false,
    clean: true,
  },
});
platform.addFields({ type: "commonjs" });
platform.addFields({ types: "./lib/index.d.ts" });
platform.addFields({ main: "./lib/index.js" });
platform.addDevDeps(`@winglang/compiler`);
platform.addDevDeps(`@winglang/sdk`);
platform.addDevDeps(`cdktf`);
platform.addDevDeps(`constructs`);

platform.addGitIgnore("**/target/");
platform.addGitIgnore("tmp/");

///////////////////////////////////////////////////////////////////////////////
const infrastructure = new TypescriptProject({
  monorepo,
  name: "@wingcloud/infrastructure",
  outdir: "apps/@wingcloud/infrastructure",
});
infrastructure.addFields({ type: "commonjs" });

infrastructure.addDevDeps("dotenv", "dotenv-expand");
infrastructure.addGitIgnore("/.env");
infrastructure.addGitIgnore("/.env.*");
infrastructure.addGitIgnore("!/.env.example");

infrastructure.addGitIgnore("**/target/");
infrastructure.addDeps("winglang");

// TODO: Remove .env sourcing after https://github.com/winglang/wing/issues/4595 is completed.
infrastructure.devTask.exec("node ./bin/wing.mjs it main.w");
infrastructure.testTask.exec("node ./bin/wing.mjs test main.w");
infrastructure.addTask("test-aws", {
  exec: "node ./bin/wing.mjs test -t tf-aws main.w",
});
infrastructure.compileTask.exec("node ./bin/wing.mjs compile main.w -t tf-aws");

const terraformInitTask = infrastructure.addTask("terraformInit");
terraformInitTask.exec(
  "node ./bin/terraform.mjs -chdir=target/main.tfaws init -input=false",
);

const planTask = infrastructure.addTask("plan");
planTask.exec(
  "node ./bin/terraform.mjs -chdir=target/main.tfaws plan -input=false -out=tfplan",
);

const deployTask = infrastructure.addTask("deploy");
deployTask.exec(
  "node ./bin/terraform.mjs -chdir=target/main.tfaws apply -input=false -auto-approve tfplan",
);

new Turbo(infrastructure, {
  pipeline: {
    [terraformInitTask.name]: {
      dependsOn: ["compile"],
      inputs: ["package.json"],
      outputs: [
        "target/main.tfaws/.terraform/**",
        "target/main.tfaws/.terraform.lock.hcl",
      ],
      cache: false,
    },
    compile: {
      dependsOn: ["^compile"],
      dotEnv: [".env"],
      inputs: ["**/*", "!node_modules/**", "!target/**"],
      outputs: [
        "target/main.tfaws/**",
        "!target/main.tfaws/.terraform.lock.hcl",
        "!target/main.tfaws/.terraform/**",
        "!target/main.tfaws/terraform.tfstate",
        "!target/main.tfaws/terraform.tfstate.backup",
        "!target/main.tfaws/tfplan",
      ],
    },
    [planTask.name]: {
      dependsOn: ["compile", terraformInitTask.name],
      cache: false,
    },
    deploy: {
      dependsOn: [planTask.name],
      cache: false,
    },
    dev: {
      dependsOn: [`${runtime.name}#compile`],
    },
    test: {
      dependsOn: ["compile"],
    },
    "test-aws": {
      dependsOn: ["compile"],
    },
  },
});

infrastructure.addDeps("express", "@vendia/serverless-express");
infrastructure.addDeps("@probot/adapter-aws-lambda-serverless");
infrastructure.addDeps("http-proxy");
infrastructure.addDeps("jsonwebtoken");
infrastructure.addDeps("node-fetch");
infrastructure.addDevDeps("@types/express", "@types/http-proxy");
infrastructure.addDevDeps("@types/jsonwebtoken");
infrastructure.addDevDeps("@types/express");

infrastructure.addDeps("glob");

infrastructure.addDeps(
  probot.name,
  containers.name,
  nanoid.name,
  dateutils.name,
  simutils.name,
  ngrok.name,
  platform.name,
);
infrastructure.addScript("example", "node ./bin/wing.mjs it example.main.w");

infrastructure.addDeps(
  "constructs",
  "cdktf",
  "@cdktf/provider-aws",
  "@cdktf/provider-dnsimple",
  "@cdktf/provider-docker",
  "@cdktf/provider-null",
  "@cdktf/provider-random",
);

infrastructure.addDeps("cookie-es");
infrastructure.addDeps("jose@4");
infrastructure.addDeps("octokit", "node-fetch");
infrastructure.addDeps("@aws-sdk/client-kms");
infrastructure.addDeps("dnsimple");
infrastructure.addDeps("@segment/analytics-node");
infrastructure.addDeps("@aws-sdk/client-sqs");
infrastructure.addDeps("@aws-sdk/client-ssm");

infrastructure.addDevDeps("@octokit/rest");

infrastructure.addDevDeps(website.name);
infrastructure.addDevDeps(runtime.name);

infrastructure.addDeps("@winglibs/websockets");

// TODO: We need to install all of these deps because of we are using pnpm
// and wing is not resolving deps correctly.
// https://github.com/winglang/wing/issues/5252#issuecomment-1893857213
infrastructure.addDeps("@aws-cdk/asset-awscli-v1");
infrastructure.addDeps("@aws-cdk/asset-kubectl-v20");
infrastructure.addDeps("@aws-cdk/asset-node-proxy-agent-v6");
infrastructure.addDeps("@balena/dockerignore");
infrastructure.addDeps("case");
infrastructure.addDeps("fs-extra");
infrastructure.addDeps("ignore");
infrastructure.addDeps("jsonschema");
infrastructure.addDeps("minimatch");
infrastructure.addDeps("punycode");
infrastructure.addDeps("semver");
infrastructure.addDeps("table");
infrastructure.addDeps("yaml");

infrastructure.addDeps("@cdktf/provider-aws");
infrastructure.addDeps("cdktf");
infrastructure.addDeps("constructs");
infrastructure.addDeps("aws-cdk-lib");

///////////////////////////////////////////////////////////////////////////////

const aws = new NodeProject({
  parent: monorepo,
  name: "@wingcloud/aws-cicd",
  outdir: "aws",
});

aws.addDeps("@cdktf/provider-aws");
aws.addDeps("cdktf");
aws.addDeps("constructs");
aws.addGitIgnore("**/target/");
aws.addFields({
  type: "commonjs",
});

///////////////////////////////////////////////////////////////////////////////

monorepo.synth();
