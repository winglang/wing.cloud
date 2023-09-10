import { MonorepoProject, TypescriptProject } from "@skyrpex/wingen";
import { JsonFile } from "projen";

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
const astro = new TypescriptProject({
  monorepo,
  name: "@wingcloud/astro",
  peerDeps: ["@aws-sdk/client-dynamodb"],
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
website.addGitIgnore("/.wingcloud/");
website
  .tryFindObjectFile("tsconfig.json")
  ?.addToArray("include", ".wingcloud/**/*");

website.addGitIgnore("/.env");

website.addDeps("@aws-sdk/util-dynamodb");
website.addDeps("jose");
website.addDeps(nanoid62.name);
website.addDeps(opaqueType.name);

{
  const project = website;
  project.addDevDeps("eslint-plugin-astro");
  const eslint = project.tryFindObjectFile(".eslintrc.json")!;
  eslint.addOverride("root", true);
  eslint.addToArray("extends", "plugin:astro/recommended");
  eslint.addToArray("overrides", {
    files: ["*.astro"],
    parser: "astro-eslint-parser",
    parserOptions: {
      parser: "@typescript-eslint/parser",
      extraFileExtensions: [".astro"],
    },
    rules: {
      // Allow returning outside of a function.
      "unicorn/prefer-module": "off",
    },
  });
  project.lintTask.reset("eslint --fix --ext .ts,.tsx,.astro .");
}

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

///////////////////////////////////////////////////////////////////////////////
// const runtime = new TypescriptProject({
//   monorepo,
//   name: "@wingcloud/runtime",
//   outdir: "apps/@wingcloud/runtime",
// });

// runtime.addDeps("winglang");
// runtime.addDeps("@winglang/sdk");
// runtime.addDeps("@wingconsole/app");
// runtime.addDeps("jsonwebtoken");
// runtime.addDeps("jwk-to-pem");
// runtime.addDeps("node-jose");
// runtime.addDeps("node-fetch");

// runtime.addDevDeps("@types/express");
// runtime.addDevDeps("@types/jsonwebtoken");
// runtime.addDevDeps("@types/jwk-to-pem");
// runtime.addDevDeps("@types/node-jose");
// runtime.addDevDeps("@types/node");
// runtime.addDevDeps("simple-git");
// runtime.addDevDeps("tsup");
// runtime.addDevDeps("typescript");
// runtime.addDevDeps("vitest");
// runtime.addDevDeps(infrastructure.name);

// runtime.devTask.exec("tsup --watch --onSuccess 'node dist/entrypoint-local.js'");
// runtime.compileTask.exec("tsup");
// runtime.testTask.exec("vitest");

// runtime.addGitIgnore("node_modules/");
// runtime.addGitIgnore("target/");
// runtime.addGitIgnore("dist/");

///////////////////////////////////////////////////////////////////////////////
monorepo.synth();
