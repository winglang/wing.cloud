import clsx from "clsx";
import { Link } from "react-router-dom";

import { GithubProjects } from "../../components/github-projects.js";

export const Component = () => {
  return (
    <>
      <h1>Projects</h1>

      <button
        className={clsx(
          "bg-slate-500 hover:bg-slate-600 text-white py-1 px-2 rounded",
          "focus:outline-none focus:shadow-outline",
        )}
      >
        Create Project
      </button>

      <div className="p-6">
        <GithubProjects />
      </div>

      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </>
  );
};
