import { PlusIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { Link, useNavigate } from "react-router-dom";

import { SpinnerLoader } from "../../components/spinner-loader.js";
import { wrpc } from "../../utils/wrpc.js";

export const Component = () => {
  const navigate = useNavigate();

  const projectsList = wrpc["user.listProjects"].useQuery();

  return (
    <>
      <div className="space-y-4">
        {projectsList.isLoading && (
          <div
            className={clsx(
              "absolute h-full w-full bg-white/70 dark:bg-slate-600/70",
              "transition-all",
              "opacity-100 z-10",
            )}
          >
            <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <SpinnerLoader />
            </div>
          </div>
        )}

        <div className="gap-2 w-full">
          <h1 className="flex justify-between items-center">
            <span className="font-semibold text-xl">Projects</span>
          </h1>

          <div className="flex flex-wrap gap-4 pt-4">
            {projectsList.data &&
              projectsList.data.projects.map((project) => (
                <button
                  onClick={() => {
                    navigate(`/dashboard/projects/${project.projectId}`);
                  }}
                  key={project.projectId}
                  className="flex flex-col justify-center items-center w-32 h-32 rounded-lg border border-gray-300 p-4 hover:bg-gray-100 transition duration-300"
                >
                  <div className="text-center">{project.name}</div>
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
