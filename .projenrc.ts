import {
  MonorepoProject,
  TypescriptProject,
  NodeEsmProject,
  NodeProject,
  TypescriptConfig,
  Eslint,
} from "@skyrpex/wingen";

///////////////////////////////////////////////////////////////////////////////
const monorepo = new MonorepoProject({
  devDeps: ["@skyrpex/wingen"],
  name: "@wingcloud/monorepo",
});

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
const cookies = new TypescriptProject({
  monorepo,
  name: "@wingcloud/express-cookies",
  deps: ["cookie"],
  devDeps: ["express", "@types/express", "@types/cookie"],
  peerDeps: ["express"],
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
api.addDeps("@winglang/sdk");
api.addDeps(opaqueType.name);
api.addDeps(nanoid62.name);
api.addDeps("jose");
api.addDeps("node-fetch");
api.addDeps(cookies.name);

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

infrastructure.addDeps("winglang");
infrastructure.devTask.exec("wing it main.w");
infrastructure.compileTask.exec("wing compile main.w --target tf-aws");
infrastructure.addGitIgnore("/target/");

infrastructure.addDeps("express", "@vendia/serverless-express");
infrastructure.addDevDeps("@types/express");

infrastructure.addDeps("glob");

infrastructure.addDeps("constructs", "cdktf", "@cdktf/provider-aws");

infrastructure.addDevDeps(website.name);

///////////////////////////////////////////////////////////////////////////////
monorepo.synth();
