import { CircleStackIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Select } from "../../components/select.js";
import { openPopupWindow } from "../../utils/popup-window.js";
import { trpc } from "../../utils/trpc.js";

const GITHUB_APP_NAME = import.meta.env["VITE_GITHUB_APP_NAME"];

export const Component = () => {
  const navigate = useNavigate();

  const userId = trpc["self"].useQuery();
  const [projectName, setProjectName] = useState("");
  const [installationId, setInstallationId] = useState("");
  const [repositoryId, setRepositoryId] = useState("");

  const installations = trpc["github.listInstallations"].useQuery();
  const repos = trpc["github.listRepos"].useQuery(
    {
      installationId: installationId || "",
    },
    {
      enabled: !!installationId,
    },
  );

  const createProjectMutation = trpc["user.createProject"].useMutation();

  const createProject = useCallback(async () => {
    if (!repositoryId || !installationId || !projectName) {
      return;
    }

    await createProjectMutation.mutateAsync({
      repositoryId,
      projectName,
      owner: userId.data?.userId || "",
    });
    navigate("/dashboard/projects");
  }, [installationId, repositoryId, installations, createProjectMutation]);

  return (
    <div className="flex justify-center pt-10">
      <div className="space-y-6 w-[25rem] bg-white rounded-lg  shadow-xl border p-6">
        <h1 className="text-xl font-bold">Create Project</h1>

        <div className="text-sm">
          <input
            className="w-full p-2 rounded border focus:outline-none mb-4 bg-sky-50"
            placeholder="Project Name"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
          />

          <div className="gap-4 mb-4 flex flex-col text-sm">
            <Select
              disabled={!projectName}
              items={(installations.data || []).map((installation) => ({
                value: installation.id.toString(),
                label: installation.name || "",
              }))}
              placeholder="Select a Git namespace"
              onChange={setInstallationId}
              value={installationId.toString()}
              btnClassName="w-full bg-sky-50 py-2 rounded border"
            />

            <div className="justify-end cursor-pointer flex flex-col gap-1">
              {repos.data?.map((repo) => (
                <button
                  className={clsx(
                    "w-full p-2 rounded border text-left ",
                    repo.id.toString() === repositoryId
                      ? "bg-sky-50 border-sky-400"
                      : "bg-white",
                  )}
                  onClick={() => setRepositoryId(repo.id.toString())}
                >
                  <CircleStackIcon className="w-4 h-4 inline-block mr-2 text-slate-400" />
                  <span>{repo.name}</span>
                </button>
              ))}

              {!repos.data && (
                <div className="w-full p-2 rounded border text-center text-slate-500">
                  <span>No repositories found</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              className={clsx(
                "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded focus:outline-none",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              onClick={createProject}
              disabled={!repositoryId || !installationId || !projectName}
            >
              Create Project
            </button>
          </div>
        </div>

        <div className="text-xs space-y-2 text-center">
          <p className="">Missing Git repository?</p>
          <button
            className="text-blue-600"
            onClick={() =>
              openPopupWindow({
                url: `https://github.com/apps/${GITHUB_APP_NAME}/installations/select_target`,
              })
            }
          >
            Adjust GitHub App Permissions →
          </button>
        </div>
      </div>
    </div>
  );
};
