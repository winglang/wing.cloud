import { Link, useParams } from "react-router-dom";

export interface ProjectProps {
  projectId: string;
}

export const Component = () => {
  const { projectId } = useParams();

  return (
    <div>
      <h2>{projectId}</h2>

      <Link to="/dashboard/projects">Back to Projects</Link>
    </div>
  );
};
