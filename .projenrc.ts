import {
  MonorepoProject,
  TypescriptProject,
  NodeEsmProject,
  NodeProject,
  TypescriptConfig,
  Eslint,
  Turbo,
} from "@skyrpex/wingen";

const winglangVersion = "^0.47.7";

///////////////////////////////////////////////////////////////////////////////
const monorepo = new MonorepoProject({
  devDeps: ["@skyrpex/wingen"],
  name: "@wingcloud/monorepo",
});

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
website.addDevDeps("typescript", "@types/node@18");
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
    dev: {
      dependsOn: ["^compile"],
    },
  },
});

website.addDeps("vite");
website.addScript("dev", "vite dev");
website.addScript("compile", "vite build");
website.addGitIgnore("/dist/");
website.addGitIgnore("/public/wing.js");

website.addDevDeps("@vitejs/plugin-react-swc");
website.addDeps("react", "react-dom");
website.addDevDeps("@types/react", "@types/react-dom");

website.addDeps("react-router-dom");

website.addDevDeps(vite.name);

website.addDevDeps("tsx", "get-port", "zod");
website.addDeps(wrpc.name);
website.addDeps("@tanstack/react-query");
website.addDeps("clsx");
website.addDeps("@headlessui/react");
website.addDeps("@heroicons/react");
website.addDeps("react-popper");

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
    target: "node18",
    dts: true,
    bundle: false,
    clean: true,
  },
});

runtime.addDeps(`winglang@${winglangVersion}`);
runtime.addDeps(`@winglang/sdk@${winglangVersion}`);
runtime.addDeps(`@winglang/compiler@${winglangVersion}`);
runtime.addDeps(`@wingconsole/app@${winglangVersion}`);
runtime.addDeps("express");
runtime.addDeps("jsonwebtoken");
runtime.addDeps("jwk-to-pem");
runtime.addDeps("jose");
runtime.addDeps("node-fetch");
runtime.addDeps("which");

runtime.addDevDeps("@types/express");
runtime.addDevDeps("@types/jsonwebtoken");
runtime.addDevDeps("@types/jwk-to-pem");
runtime.addDevDeps("simple-git");
runtime.addDevDeps("msw");
runtime.addDevDeps("@types/which");

runtime.addGitIgnore("target/");

runtime.devTask.exec("tsup --watch --onSuccess 'node lib/entrypoint-local.js'");

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
infrastructure.addDeps(`winglang@${winglangVersion}`);
// TODO: Remove .env sourcing after https://github.com/winglang/wing/issues/4595 is completed.
infrastructure.devTask.exec("node ./bin/wing.mjs it main.w");
infrastructure.testTask.exec("node ./bin/wing.mjs test main.w");
infrastructure.addTask("test-aws", {
  exec: "node ./bin/wing.mjs test -t tf-aws main.w",
});
infrastructure.compileTask.exec("node ./bin/wing.mjs compile -t tf-aws");

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
      inputs: ["package.json"],
      outputs: [
        "target/main.tfaws/.terraform/**",
        "target/main.tfaws/.terraform.lock.hcl",
      ],
    },
    compile: {
      dependsOn: ["^compile", terraformInitTask.name],
      dotEnv: [".env"],
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
      dependsOn: ["compile"],
      // outputs: ["target/main.tfaws/tfplan"],
      cache: false,
    },
    deploy: {
      // dependsOn: ["^compile"],
      dependsOn: [planTask.name],
      cache: false,
    },
    dev: {
      dependsOn: ["^compile"],
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
  "constructs",
  "cdktf",
  "@cdktf/provider-aws",
  "@cdktf/provider-dnsimple",
  "@cdktf/provider-docker",
  "@cdktf/provider-null",
  "@cdktf/provider-random",
);

infrastructure.addDevDeps("@types/cookie");
infrastructure.addDeps("cookie");

infrastructure.addDeps("jose");

infrastructure.addDeps("octokit", "node-fetch");

infrastructure.addDeps("@aws-sdk/client-ssm");

infrastructure.addDevDeps("@octokit/rest");

infrastructure.addDevDeps(website.name);
infrastructure.addDevDeps(runtime.name);

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
