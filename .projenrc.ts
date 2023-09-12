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

api.addDevDeps("tsx");
api.addScript("dev", "tsx watch src/index.ts");

api.addDeps("express");
api.addDevDeps("@types/express");

api.addDeps("@trpc/server", "zod");
api.addDeps("nanoid");
api.addDeps("@aws-sdk/client-dynamodb");
api.addDeps("@winglang/sdk");

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

website.addDevDeps(api.name, "tsx", "get-port");

website.addDeps("tailwindcss");

website.addDeps("@trpc/server", "zod");

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

website
  .tryFindObjectFile("tsconfig.json")
  ?.addOverride("compilerOptions.esModuleInterop", true);

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
