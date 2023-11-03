import {
  MonorepoProject,
  TypescriptProject,
  NodeEsmProject,
  NodeProject,
  TypescriptConfig,
  Eslint,
  Turbo,
} from "@skyrpex/wingen";
import { JsonFile, web } from "projen";

///////////////////////////////////////////////////////////////////////////////
const monorepo = new MonorepoProject({
  devDeps: ["@skyrpex/wingen"],
  name: "@wingcloud/monorepo",
});

///////////////////////////////////////////////////////////////////////////////
const opaqueType = new TypescriptProject({
  monorepo,
  name: "@wingcloud/type-opaque",
});

///////////////////////////////////////////////////////////////////////////////
const nanoid62 = new TypescriptProject({
  monorepo,
  name: "@wingcloud/nanoid62",
  deps: ["nanoid"],
});

///////////////////////////////////////////////////////////////////////////////
const flyio = new TypescriptProject({
  monorepo,
  name: "@wingcloud/flyio",
  description: "Fly.io client library",
});

flyio.compileTask.reset();
flyio.compileTask.exec("jsii");
flyio.packageTask.exec("jsii-pacmak");
flyio.devTask.exec("jsii --watch");

flyio.addDeps("node-fetch@2");
flyio.addDevDeps("@types/node-fetch@2");
flyio.addDevDeps("jsii");
flyio.addDevDeps("jsii-pacmak");

flyio.tryRemoveFile("./tsconfig.json");

new Turbo(flyio, {
  pipeline: {
    compile: {
      outputs: ["./src/**/*.js", "./src/**/*.d.ts"],
    },
  },
});

flyio.addGitIgnore("**/*.js");
flyio.addGitIgnore("**/*.d.ts");
flyio.addGitIgnore(".jsii");
flyio.addGitIgnore("tsconfig.tsbuildinfo");
flyio.addFields({
  type: "commonjs",
  main: "./src/index.js",
  exports: {
    ".": "./src/index.js",
  },
  types: "./src/index.d.ts",
  jsii: {
    outdir: "dist",
    targets: [],
    versionFormat: "full",
  },
  bundledDependencies: ["node-fetch"],
  author: {
    name: "wing.cloud",
    url: "https://wing.cloud",
  },
  repository: {
    type: "git",
    url: "https://github.com/winglang/wing.cloud",
  },
  license: "BSD-3-Clause",
});

///////////////////////////////////////////////////////////////////////////////
const prefixedIdType = new TypescriptProject({
  monorepo,
  name: "@wingcloud/type-prefixed-id",
  deps: [nanoid62.name, "zod"],
});

///////////////////////////////////////////////////////////////////////////////
const cookies = new TypescriptProject({
  monorepo,
  name: "@wingcloud/express-cookies",
  deps: ["cookie"],
  devDeps: ["express", "@types/express", "@types/cookie"],
  peerDeps: ["express"],
});

///////////////////////////////////////////////////////////////////////////////
const env = new TypescriptProject({
  monorepo,
  name: "@wingcloud/get-environment-variable",
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
website.addDeps("@ibm/plex");

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

runtime.addDeps(`winglang`);
runtime.addDeps(`@winglang/sdk`);
runtime.addDeps(`@winglang/compiler`);
runtime.addDeps(`@wingconsole/app`);
runtime.addDeps("express");
runtime.addDeps("jsonwebtoken");
runtime.addDeps("jwk-to-pem");
runtime.addDeps("jose");
runtime.addDeps("node-fetch");

runtime.addDevDeps("@types/express");
runtime.addDevDeps("@types/jsonwebtoken");
runtime.addDevDeps("@types/jwk-to-pem");
runtime.addDevDeps("simple-git");
runtime.addDevDeps("msw");

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

infrastructure.addGitIgnore("/target/");
infrastructure.addDeps(`winglang`);
// TODO: Remove .env sourcing after https://github.com/winglang/wing/issues/4595 is completed.
infrastructure.devTask.exec("node ./bin/wing.mjs it main.w");
infrastructure.compileTask.exec(
  "node ./bin/wing.mjs compile --target tf-aws --plugins override-function-memory.js",
);

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
        "target/main.tfaws/.terraform",
        "target/main.tfaws/.terraform.lock.hcl",
      ],
    },
    compile: {
      dependsOn: [terraformInitTask.name],
      dotEnv: [".env"],
      outputs: [
        "target/main.tfaws/**",
        "!target/main.tfaws/.terraform.lock.hcl",
        "!target/main.tfaws/.terraform",
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
);

infrastructure.addDevDeps("@types/cookie");
infrastructure.addDeps("cookie");

infrastructure.addDeps("jose");

infrastructure.addDeps("octokit", "node-fetch");

infrastructure.addDevDeps("@types/cookie");
infrastructure.addDeps("cookie");

infrastructure.addDeps("jose");

infrastructure.addDeps("octokit", "node-fetch");

infrastructure.addDevDeps(website.name);
infrastructure.addDevDeps(flyio.name);
infrastructure.addDevDeps(runtime.name);

///////////////////////////////////////////////////////////////////////////////
monorepo.synth();
