import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/20/solid";
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

  const installations = trpc["github.listInstallations"].useQuery();
  const repos = trpc["github. listRepositories"].useQuery(
    {
      installationId: installationId || "",
    },
    {
      enabled: !!installationId,
    },
  );

  const createProjectMutation = trpc["user.createProject"].useMutation();

  const createProject = useCallback(
    async (repositoryId: string) => {
      if (!installationId) {
        return;
      }

      await createProjectMutation.mutateAsync({
        repositoryId,
        projectName:
          projectName ||
          repos.data?.find((repo) => repo.id.toString() === repositoryId)
            ?.name ||
          "",
        owner: userId.data?.userId || "",
      });
      navigate("/dashboard/projects");
    },
    [installationId, installations, createProjectMutation],
  );

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
              items={(installations.data || []).map((installation) => ({
                value: installation.id.toString(),
                label: installation.name || "",
              }))}
              placeholder="Select a GitHub namespace"
              onChange={(value) => {
                setInstallationId(value);
              }}
              value={installationId.toString()}
              btnClassName="w-full bg-sky-50 py-2 rounded border"
            />

            <div className="justify-end flex flex-col gap-1">
              {repos.data?.map((repo) => (
                <div
                  key={repo.id}
                  className={clsx(
                    "w-full p-2 rounded border text-left flex items-center",
                  )}
                >
                  <img
                    src={repo.imgUrl}
                    className="w-5 h-5 inline-block mr-2 rounded-full"
                  />
                  <span>{repo.name}</span>
                  <div className="mx-1 items-center">
                    {repo.private && (
                      <LockClosedIcon className="w-3 h-3 inline-block" />
                    )}
                  </div>

                  <div className="flex grow justify-end text-slate-500 items-center">
                    <button
                      className={clsx(
                        "mr-2 py-0.5 px-1 rounded border text-xs cursor-pointer",
                        "hover:bg-sky-50 transition duration-300",
                      )}
                      onClick={() => createProject(repo.id.toString())}
                      disabled={!installationId}
                    >
                      Import
                    </button>
                  </div>
                </div>
              ))}

              {!repos.data && (
                <div className="w-full p-2 rounded border text-center text-slate-500">
                  <span>No repositories found</span>
                </div>
              )}
            </div>
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
