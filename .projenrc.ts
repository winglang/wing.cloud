import {
  MonorepoProject,
  NodeProject,
  TypescriptProject,
  type NodeProjectOptions,
} from "@skyrpex/wingen";

///////////////////////////////////////////////////////////////////////////////
const monorepo = new MonorepoProject({
  devDeps: ["@skyrpex/wingen"],
  name: "@wingcloud/monorepo",
});

monorepo.addGitIgnore("target/");

///////////////////////////////////////////////////////////////////////////////
const opaqueType = new TypescriptProject({
  monorepo,
  name: "@wingcloud/opaque-type",
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
  description: "Fly.io client library"
});

flyio.compileTask.reset();
flyio.compileTask.exec("jsii");
flyio.packageTask.exec("jsii-pacmak");
flyio.addScript("compile:watch", "jsii --watch");

flyio.addDeps("node-fetch@2.6.4");
flyio.addDevDeps("@types/node-fetch@2.6.4");
flyio.addDevDeps("@types/node@18");
flyio.addDevDeps("jsii");
flyio.addDevDeps("jsii-pacmak");

flyio.tryRemoveFile("./tsconfig.json");
flyio.tryRemoveFile("./tsup.config.ts");

flyio.addGitIgnore("**/*.js");
flyio.addGitIgnore("**/*.d.ts");
flyio.addGitIgnore(".jsii");
flyio.addGitIgnore("tsconfig.tsbuildinfo");

{
  const packageJson = flyio.tryFindObjectFile("package.json")!;
  packageJson.addOverride("jsii", {
    "outdir": "dist",
    "targets": [],
    "versionFormat": "full"
  });
  packageJson.addOverride("bundledDependencies", [
    "node-fetch"
  ]);
  packageJson.addOverride("author", {
    name: "wing.cloud",
    url: "https://wing.cloud"
  });
  packageJson.addOverride("repository", {
    type: "git",
    url: "https://github.com/winglang/wing.cloud"
  });
  packageJson.addOverride("license", "BSD-3-Clause");
  packageJson.addOverride("main", "./lib/index.js");
}

///////////////////////////////////////////////////////////////////////////////
type NodeEsmProjectOptions = Omit<NodeProjectOptions, "parent"> & {
  monorepo: MonorepoProject;
};

class NodeEsmProject extends NodeProject {
  constructor(options: NodeEsmProjectOptions) {
    super({
      outdir: `packages/${options.name}`,
      ...options,
      parent: options.monorepo,
    });

    this.addFields({
      type: "module",
      exports: { ".": "./src/index.js" },
      types: "./src/index.d.ts",
    });
  }
}

///////////////////////////////////////////////////////////////////////////////
const vite = new NodeEsmProject({
  monorepo,
  name: "@wingcloud/vite",
});

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

api.addDeps("@trpc/server", "zod");
api.addDeps("nanoid");
api.addDeps("@aws-sdk/client-dynamodb");
api.addDeps("@aws-sdk/util-dynamodb");
api.addDeps("@winglang/sdk");
api.addDeps(opaqueType.name);
api.addDeps(nanoid62.name);
api.addDeps("jose");
api.addDeps("node-fetch");

///////////////////////////////////////////////////////////////////////////////
const website = new TypescriptProject({
  monorepo,
  name: "@wingcloud/website",
  outdir: "apps/@wingcloud/website",
});
website.addDeps("vite");
website.addScript("dev", "vite dev --open");
website.addScript("compile", "vite build");

website.addDevDeps("@vitejs/plugin-react-swc");
website.addDeps("react", "react-dom");
website.addDevDeps("@types/react", "@types/react-dom");

website.addDevDeps(vite.name);

website.addDevDeps(api.name, "tsx", "get-port", "zod");
website.addDeps(
  "@trpc/client",
  "@trpc/server",
  "@trpc/react-query",
  "@tanstack/react-query",
);

website.addDevDeps("tailwindcss", "postcss", "autoprefixer");

website.addDeps("@trpc/server", "zod");

website.addDevDeps("@aws-sdk/client-dynamodb");
website.addGitIgnore("/.wingcloud/");
website
  .tryFindObjectFile("tsconfig.json")
  ?.addToArray("include", ".wingcloud/**/*");

website.addGitIgnore("/.env");

website.addDevDeps("@types/node@18");
{
  const tsconfig = website.tryFindObjectFile("tsconfig.json")!;
  tsconfig.addOverride("compilerOptions.jsx", "react-jsx");
  tsconfig.addToArray("compilerOptions.lib", "DOM", "DOM.Iterable");
  tsconfig.addToArray("include", "plugins/**/*");
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

infrastructure.addDeps("winglang");
infrastructure.devTask.exec("wing it main.w");
infrastructure.compileTask.exec("wing compile main.w --target sim && wing compile main.w --target tf-aws");
infrastructure.addGitIgnore("/target/");

infrastructure.addDeps("express", "@vendia/serverless-express");
infrastructure.addDevDeps("@types/express");

infrastructure.addDeps("glob");

infrastructure.addDeps("constructs", "cdktf", "@cdktf/provider-aws");

infrastructure.addDevDeps(website.name);
infrastructure.addDevDeps(flyio.name);

///////////////////////////////////////////////////////////////////////////////
const runtime = new TypescriptProject({
  monorepo,
  name: "@wingcloud/runtime",
  outdir: "apps/@wingcloud/runtime",
});

runtime.addDeps("winglang");
runtime.addDeps("@winglang/sdk");
runtime.addDeps("@wingconsole/app");
runtime.addDeps("express");
runtime.addDeps("jsonwebtoken");
runtime.addDeps("jwk-to-pem");
runtime.addDeps("node-jose");
runtime.addDeps("node-fetch");

runtime.addDevDeps("@types/express");
runtime.addDevDeps("@types/jsonwebtoken");
runtime.addDevDeps("@types/jwk-to-pem");
runtime.addDevDeps("@types/node-jose");
runtime.addDevDeps("@types/node@18");
runtime.addDevDeps("simple-git");
runtime.addDevDeps("tsup");
runtime.addDevDeps("typescript");
runtime.addDevDeps("vitest");
runtime.addDevDeps(infrastructure.name);

runtime.devTask.exec("tsup --watch --onSuccess 'node lib/entrypoint-local.js'");
runtime.testTask.exec("vitest");

runtime.addGitIgnore("node_modules/");
runtime.addGitIgnore("target/");
runtime.addGitIgnore("dist/");

///////////////////////////////////////////////////////////////////////////////
monorepo.synth();
