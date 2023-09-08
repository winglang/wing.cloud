import {
  MonorepoProject,
  NodeProject,
  TypescriptProject,
} from "@skyrpex/wingen";
import { JsonFile } from "projen";

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
const astro = new TypescriptProject({
  monorepo,
  name: "@wingcloud/astro",
  peerDeps: ["@aws-sdk/client-dynamodb"],
});

astro.addFields({
  types: "src/index.ts",
});
astro.addDevDeps("astro");
astro.addDevDeps("vite");
astro.addDevDeps("nanoid");
astro.addDevDeps("@aws-sdk/client-dynamodb");

astro.addDeps("@winglang/sdk");
astro.addDeps("death");

astro.addDeps("dotenv");

///////////////////////////////////////////////////////////////////////////////
const website = new TypescriptProject({
  monorepo,
  name: "@wingcloud/website",
  outdir: "apps/@wingcloud/website",
});
website.addDeps("astro");
// website.devTask.reset("astro dev --open");
// website.compileTask.reset("astro build");
website.addScript("dev", "astro dev --open");
website.addScript("compile", "astro build");

website.addDeps("@astrojs/node");

website.addDeps("@astrojs/react", "react", "react-dom");
website.addDevDeps("@types/react", "@types/react-dom");

website.addDeps("@astrojs/tailwind", "tailwindcss");

website.addDeps("@trpc/server", "zod");

website.addDevDeps("prettier-plugin-astro");
new JsonFile(website, ".prettierrc.json", {
  marker: false,
  obj: {
    tabWidth: 2,
    useTabs: false,
    trailingComma: "all",
    plugins: ["prettier-plugin-astro"],
  },
});

website.addDeps(astro.name);
website.addDevDeps("@aws-sdk/client-dynamodb");
website.addGitIgnore("/.wing/");
website.tryFindObjectFile("tsconfig.json")?.addToArray("include", ".wing/**/*");

website.addGitIgnore("/.env");

website.addDeps("@aws-sdk/util-dynamodb");
website.addDeps("jose");
website.addDeps(nanoid62.name);
website.addDeps(opaqueType.name);

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
