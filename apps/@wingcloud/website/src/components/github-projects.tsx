import { trpc } from "../utils/trpc.js";

export const GithubProjects = () => {
  const projects = trpc["github/list-projects"].useQuery();

  return (
    <>
      <h1 className="font-bold">Projects</h1>
      <ul className="pl-2">
        {projects.data?.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </>
  );
};
