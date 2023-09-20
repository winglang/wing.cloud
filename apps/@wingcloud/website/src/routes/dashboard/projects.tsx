import { PlusIcon } from "@heroicons/react/20/solid";
import { Link, useNavigate } from "react-router-dom";

import { trpc } from "../../utils/trpc.js";

export const Component = () => {
  const userId = trpc["self"].useQuery();
  const navigate = useNavigate();

  const projectsList = trpc["user.listProjects"].useQuery();

  return (
    <>
      <div className="space-y-4">
        <div className="gap-2 w-full">
          <h1 className="flex justify-between items-center">
            <span className="font-semibold text-xl">Projects</span>
            <span className="text-gray-500">({userId.data?.userId})</span>
          </h1>

          <div className="flex flex-wrap gap-4 pt-4">
            {projectsList.data &&
              projectsList.data.map((project, key) => (
                <button
                  onClick={() => {
                    navigate(`/dashboard/projects/${project?.projectId}`);
                  }}
                  key={project?.projectId || key}
                  className="flex flex-col justify-center items-center w-32 h-32 rounded-lg border border-gray-300 p-4 hover:bg-gray-100 transition duration-300"
                >
                  <div className="text-center">{project?.name}</div>
                </button>
              ))}
            <button
              onClick={() => {
                navigate("/dashboard/new");
              }}
              className="flex flex-col justify-center items-center w-32 h-32 rounded-lg border border-gray-300 p-4 bg-sky-50 transition duration-300"
            >
              <div className="text-center">
                <PlusIcon className="w-8 h-8 text-sky-600" />
              </div>
            </button>
          </div>
        </div>

        <p>
          <Link to="/">Go to the home page</Link>
        </p>
      </div>
    </>
  );
};
