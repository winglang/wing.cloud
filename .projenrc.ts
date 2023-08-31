import { MonorepoProject, TypescriptProject } from "@skyrpex/wingen";

const monorepo = new MonorepoProject({
  devDeps: ["@skyrpex/wingen"],
  name: "@wingcloud/monorepo",
});

// const lib = new TypescriptProject({ parent: monorepo, name: "@my/lib" });
// const app = new TypescriptProject({ parent: monorepo, name: "@my/app", deps: [lib.name] });

monorepo.synth();
