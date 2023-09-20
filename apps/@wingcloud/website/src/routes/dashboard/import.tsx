import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useCallback, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { trpc } from "../../utils/trpc.js";

export const Component = () => {
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState("");

  const [search] = useSearchParams();
  const repositoryId = search.get("repositoryId");
  const repositoryName = search.get("repositoryName");

  const createProjectMutation = trpc["user.createProject"].useMutation();

  const createProject = useCallback(async () => {
    if (!repositoryId) {
      return;
    }
    await createProjectMutation.mutateAsync({
      repositoryId,
      projectName,
    });
    navigate("/dashboard/projects");
  }, [projectName, createProjectMutation]);

  return (
    <div className="flex justify-center pt-10">
      <div className="space-y-6 w-[25rem] bg-white rounded-lg  shadow-xl border p-6">
        <h1 className="text-xl font-bold">Create Project</h1>

        <div className="text-sm flex flex-col gap-4">
          <div className="w-full p-2 rounded border text-left flex items-center bg-slate-100">
            {repositoryName}
          </div>

          <input
            className="w-full p-2 rounded border focus:outline-none mb-4 bg-sky-50"
            placeholder="Project Name"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
          />

          <button
            className="w-full p-2 rounded border focus:outline-none mb-4 bg-sky-50"
            onClick={createProject}
            disabled={!projectName || !repositoryId}
          >
            Deploy
          </button>
          <div className="text-xs text-center">
            <Link className="text-blue-600" to="/dashboard/projects">
              Go back to projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
