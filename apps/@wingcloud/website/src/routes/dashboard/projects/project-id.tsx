import { Link, useParams } from "react-router-dom";

import { wrpc } from "../../../utils/wrpc.js";

export interface ProjectProps {
  projectId: string;
}

export const Component = () => {
  const { projectId } = useParams();
  if (!projectId) return;

  const project = wrpc["project.get"].useQuery({ id: projectId });

  return (
    <div>
      <h2>{projectId}</h2>

      <pre>
        <code>{JSON.stringify(project.data, undefined, 2)}</code>
      </pre>

      <Link to="/dashboard/projects">Back to Projects</Link>
    </div>
  );
};
