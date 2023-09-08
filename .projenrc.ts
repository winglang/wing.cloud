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
const astroDynamodbIntegration = new TypescriptProject({
  monorepo,
  name: "@wingcloud/astro-dynamodb-integration",
  peerDeps: ["@aws-sdk/client-dynamodb"],
});

astroDynamodbIntegration.addFields({
  types: "src/index.ts",
});
astroDynamodbIntegration.addDevDeps("astro");
astroDynamodbIntegration.addDevDeps("vite");
astroDynamodbIntegration.addDevDeps("nanoid");
astroDynamodbIntegration.addDevDeps("@aws-sdk/client-dynamodb");

astroDynamodbIntegration.addDeps("@winglang/sdk");
astroDynamodbIntegration.addDeps("death");

///////////////////////////////////////////////////////////////////////////////
const website = new TypescriptProject({
  monorepo,
  name: "@wingcloud/website",
});
website.addDeps("astro");
website.devTask.reset("astro dev --open");
website.compileTask.reset("astro build");

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

website.addDeps(astroDynamodbIntegration.name, "@aws-sdk/client-dynamodb");
website.addGitIgnore("/.wing/");
website.addGitIgnore(".env");
website.tryFindObjectFile("tsconfig.json")?.addToArray("include", ".wing/**/*");

///////////////////////////////////////////////////////////////////////////////
const infrastructure = new TypescriptProject({
  monorepo,
  name: "@wingcloud/infrastructure",
  outdir: "packages/@wingcloud/infrastructure",
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
