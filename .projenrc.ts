import {
  MonorepoProject,
  TypescriptProject,
  NodeEsmProject,
  NodeProject,
  TypescriptConfig,
  Eslint,
} from "@skyrpex/wingen";
import { JsonFile } from "projen";

const WING_VERSION = "0.34.13";

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

new JsonFile(flyio, "turbo.json", {
  marker: false,
  obj: {
    $schema: "https://turbo.build/schema.json",
    extends: ["//"],
    pipeline: {
      compile: {
        outputs: ["./src/**/*.js", "./src/**/*.d.ts"],
      },
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
const vite = new NodeEsmProject({
  monorepo,
  name: "@wingcloud/vite",
});
vite.addFields({ types: "./src/index.d.ts" });

vite.addDevDeps("vite");
vite.addDeps("dotenv");

///////////////////////////////////////////////////////////////////////////////
const api = new TypescriptProject({
  monorepo,
  name: "@wingcloud/api",
  outdir: "apps/@wingcloud/api",
});

api.addGitIgnore("/.env");

api.removeTask("dev");
api.removeTask("build");
api.removeTask("compile");

api.addDeps("express");
api.addDevDeps("@types/express");

api.addDeps("dotenv");

api.addDeps("@trpc/server", "zod");
api.addDeps("nanoid");
api.addDeps("@aws-sdk/client-dynamodb");
api.addDeps("@aws-sdk/util-dynamodb");
api.addDeps(`@winglang/sdk@${WING_VERSION}`);
api.addDeps(opaqueType.name);
api.addDeps(prefixedIdType.name);
api.addDeps(nanoid62.name);
api.addDeps("jose");
api.addDeps("node-fetch");
api.addDeps(cookies.name);
api.addDeps(env.name);
api.addDeps("octokit");

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

website.addDeps("vite");
website.addScript("dev", "vite dev --open");
website.addScript("compile", "vite build");
website.addGitIgnore("/dist/");

website.addDevDeps("@vitejs/plugin-react-swc");
website.addDeps("react", "react-dom");
website.addDevDeps("@types/react", "@types/react-dom");

website.addDeps("react-router-dom");

website.addDevDeps(vite.name);

website.addDevDeps(api.name, "tsx", "get-port", "zod");
website.addDeps(
  "@trpc/client",
  "@trpc/server",
  "@trpc/react-query",
  "@tanstack/react-query",
);
website.addDeps("clsx");
website.addDeps("@headlessui/react");
website.addDeps("@heroicons/react");
website.addDeps("react-popper");

website.addDevDeps("tailwindcss", "postcss", "autoprefixer");

website.addDeps("@trpc/server", "zod");

website.addDevDeps("@aws-sdk/client-dynamodb");
website.addGitIgnore("/.wingcloud/");

website.addGitIgnore("/.env");

{
  const tsconfig = website.tryFindObjectFile("tsconfig.json")!;
  tsconfig.addOverride("compilerOptions.jsx", "react-jsx");
  tsconfig.addToArray("compilerOptions.lib", "DOM", "DOM.Iterable");
  tsconfig.addToArray("include", "plugins/**/*", ".wingcloud/**/*");
}

website.addDevDeps("node-fetch");
website.addDevDeps("nanoid");

///////////////////////////////////////////////////////////////////////////////
const infrastructure = new TypescriptProject({
  monorepo,
  name: "@wingcloud/infrastructure",
  outdir: "apps/@wingcloud/infrastructure",
});
infrastructure.addFields({ type: "commonjs" });

infrastructure.addDeps(`winglang@${WING_VERSION}`);
infrastructure.devTask.exec("wing it main.w");
infrastructure.compileTask.exec("wing compile main.w --target sim");
infrastructure.compileTask.exec("wing compile main.w --target tf-aws");
infrastructure.addGitIgnore("/target/");

infrastructure.addDeps("express", "@vendia/serverless-express");
infrastructure.addDeps("@probot/adapter-aws-lambda-serverless");
infrastructure.addDeps("http-proxy");
infrastructure.addDeps("jsonwebtoken");
infrastructure.addDeps("node-fetch");
infrastructure.addDevDeps("@types/express", "@types/http-proxy");
infrastructure.addDevDeps("@types/jsonwebtoken");
infrastructure.addDevDeps("@types/express");

infrastructure.addDeps("glob");

infrastructure.addDeps("constructs", "cdktf", "@cdktf/provider-aws", "@cdktf/provider-dnsimple", "@cdktf/provider-docker", "@cdktf/provider-null");

infrastructure.addDevDeps(website.name);
infrastructure.addDevDeps(flyio.name);

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

runtime.addDeps(`winglang@${WING_VERSION}`);
runtime.addDeps(`@winglang/sdk@${WING_VERSION}`);
runtime.addDeps(`@winglang/compiler@${WING_VERSION}`);
runtime.addDeps(`@wingconsole/app@${WING_VERSION}`);
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
monorepo.synth();
