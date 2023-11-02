import { LockClosedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Header } from "../components/header.js";
import { Select } from "../components/select.js";
import { SpinnerLoader } from "../components/spinner-loader.js";
import { openPopupWindow } from "../utils/popup-window.js";
import { wrpc, type Repository } from "../utils/wrpc.js";

const GITHUB_APP_NAME = import.meta.env["VITE_GITHUB_APP_NAME"];

export const Component = () => {
  const navigate = useNavigate();

  const [entryfile, setEntryfile] = useState("main.w");
  const [installationId, setInstallationId] = useState("");
  const [repositoryId, setRepositoryId] = useState("");

  const installations = wrpc["github.listInstallations"].useQuery();
  useEffect(() => {
    if (installationId === "") {
      setInstallationId(
        installations.data?.installations[0]?.id.toString() || "",
      );
    }
  }, [installations.data]);

  const repos = wrpc["github.listRepositories"].useQuery(
    {
      installationId: installationId,
    },
    {
      enabled: installationId != "",
    },
  );

  const createAppMutation = wrpc["user.createApp"].useMutation();
  const createApp = useCallback(
    async (repo: Repository) => {
      if (!repo.id) {
        return;
      }
      setRepositoryId(repo.id.toString());
      await createAppMutation.mutateAsync({
        repositoryId: repo.id.toString(),
        repositoryName: repo.name,
        owner: repo.owner?.login || "",
        default_branch: repo.default_branch || "",
        entryfile,
        appName: repo.name,
        imageUrl: repo.owner?.avatar_url || "",
      });
      navigate("/apps");
    },
    [createAppMutation],
  );

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Apps", to: "/apps" },
          {
            label: "New",
            to: "/new",
          },
        ]}
      />
      <div className="p-6 space-y-4 w-full max-w-5xl mx-auto">
        <div className="text-2xl">Create a new app</div>

        {installations.isLoading && (
          <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <SpinnerLoader />
          </div>
        )}

        {!installations.isLoading && (
          <div className="flex justify-center pt-10">
            <div
              className={clsx(
                "space-y-6",
                "w-[25rem] bg-white rounded-lg shadow-xl border p-6",
              )}
            >
              <div className="text-sm">
                <div className="gap-4 mb-4 flex flex-col text-sm">
                  <Select
                    items={(installations.data?.installations || []).map(
                      (installation) => ({
                        value: installation.id.toString(),
                        label: installation.account.login || "",
                      }),
                    )}
                    placeholder="Select a GitHub namespace"
                    onChange={(value) => {
                      if (!value) {
                        return;
                      }
                      setInstallationId(value);
                    }}
                    value={installationId.toString()}
                    btnClassName="w-full bg-sky-50 py-2 rounded border"
                  />

                  <div className="justify-end flex flex-col gap-1">
                    {repos.data?.repositories.map((repo) => (
                      <div
                        key={repo.id}
                        className={clsx(
                          "w-full p-2 rounded border text-left flex items-center",
                          "bg-white",
                        )}
                      >
                        <img
                          src={repo.owner?.avatar_url}
                          className="w-5 h-5 inline-block mr-2 rounded-full"
                        />
                        <span>{repo.name}</span>
                        <div className="mx-1 items-center">
                          {repo.private && (
                            <LockClosedIcon className="w-3 h-3 inline-block text-slate-600" />
                          )}
                        </div>

                        <div className="flex grow justify-end text-slate-500 items-center">
                          <button
                            className={clsx(
                              "mr-2 py-0.5 px-1 rounded border text-xs cursor-pointer",
                              "hover:bg-sky-50 transition duration-300",
                              "flex gap-1",
                            )}
                            onClick={() => {
                              createApp(repo);
                            }}
                            disabled={!installationId}
                          >
                            <div>Import</div>
                            {repositoryId === repo.id.toString() && (
                              <div className="flex justify-center">
                                <SpinnerLoader size="xs" />
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}

                    {installationId && repos.isLoading && (
                      <div className="w-full p-2 rounded border text-slate-500 flex justify-center">
                        <SpinnerLoader size="xs" />
                      </div>
                    )}

                    {(!installationId || (!repos.data && !repos.isLoading)) && (
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
        )}
      </div>
    </>
  );
};
