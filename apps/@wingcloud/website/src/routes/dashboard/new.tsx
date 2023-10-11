import { LockClosedIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Select } from "../../components/select.js";
import { openPopupWindow } from "../../utils/popup-window.js";
import { useClient } from "../../utils/wrpc.js";

const GITHUB_APP_NAME = import.meta.env["VITE_GITHUB_APP_NAME"];

export const Component = () => {
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState("");
  const [installationId, setInstallationId] = useState("");

  // @ts-ignore-next-line
  const apiUrl = window.wingEnv.API_URL;
  const client = useClient(apiUrl);

  const installations = client.query("github.listInstallations");
  const selectedInstallation = useMemo(
    () =>
      installations.data?.installations.find(
        (installation) => installation.id.toString() === installationId,
      ),
    [installations.data, installationId],
  );

  const repos = client.query(
    "github.listRepositories",
    {
      installationId: installationId || "",
    },
    {
      enabled: !!installationId,
    },
  );

  const createProjectMutation = client.mutation("user.createProject");

  const createProject = useCallback(
    async (repositoryId: string) => {
      if (!repositoryId) {
        return;
      }
      await createProjectMutation.mutateAsync({
        repositoryId,
        projectName,
      });
      navigate("/dashboard/projects");
    },
    [projectName, createProjectMutation],
  );

  return (
    <>
      <div className="flex justify-center pt-10">
        <div className="space-y-6 w-[25rem] bg-white rounded-lg  shadow-xl border p-6">
          <h1 className="text-xl font-bold">New Project</h1>

          <div className="text-sm">
            <div className="gap-4 mb-4 flex flex-col text-sm">
              <input
                className="w-full p-2 rounded border focus:outline-none mb-4 bg-sky-50"
                placeholder="Project Name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />

              <Select
                items={(installations.data?.installations || []).map(
                  (installation) => ({
                    value: installation.id.toString(),
                    label: installation.name || "",
                  }),
                )}
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
                    <span>
                      {selectedInstallation ? selectedInstallation.name : ""}/
                      {repo.name}
                    </span>
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
                        onClick={() => {
                          createProject(repo.id.toString());
                        }}
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
      <p>
        <Link to="/dashboard/projects">Go to the home page</Link>
      </p>
    </>
  );
};
