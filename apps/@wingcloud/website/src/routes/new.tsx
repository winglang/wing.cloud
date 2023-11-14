import { LockClosedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { set } from "zod";

import { SpinnerLoader } from "../components/spinner-loader.js";
import { Select } from "../design-system/select.js";
import { usePopupWindow } from "../utils/popup-window.js";
import { wrpc, type Repository } from "../utils/wrpc.js";

const GITHUB_APP_NAME = import.meta.env["VITE_GITHUB_APP_NAME"];

export const Component = () => {
  const navigate = useNavigate();
  const openPopupWindow = usePopupWindow();

  const [entryfile, setEntryfile] = useState("main.w");
  const [installationId, setInstallationId] = useState<string>();
  const [repositoryId, setRepositoryId] = useState("");

  const installations = wrpc["github.listInstallations"].useQuery();

  useEffect(() => {
    const firstInstallationId =
      installations.data?.installations[0]?.id.toString();
    if (firstInstallationId) {
      setInstallationId(firstInstallationId);
    }
  }, [installations.data]);

  // TODO: Feels cleaner to separate in different components so we don't have to use the `enabled` option.
  const repos = wrpc["github.listRepositories"].useQuery(
    {
      installationId: installationId!,
    },
    {
      enabled: installationId != undefined,
    },
  );

  const createAppMutation = wrpc["user.createApp"].useMutation();
  const createApp = useCallback(
    async (repo: Repository) => {
      if (!repo.id) {
        return;
      }
      setRepositoryId(repo.full_name.toString());

      await createAppMutation.mutateAsync({
        appName: repo.name,
        description: repo.description ?? "",
        repoId: repo.full_name.toString(),
        repoName: repo.name,
        repoOwner: repo.owner.login,
        entryfile,
        default_branch: repo.default_branch,
        imageUrl: repo.owner.avatar_url,
        installationId: installationId!,
      });
      navigate("/apps/");
    },
    [createAppMutation],
  );

  const onCloseRepositoryPopup = useCallback(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    setInstallationId(undefined);
    installations.refetch();
  }, [installations.refetch]);

  return (
    <>
      {installations.isFetching && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}

      {!installations.isFetching && (
        <div className="flex justify-center pt-10">
          <div
            className={clsx(
              "space-y-6",
              "w-[25rem] bg-white rounded-lg shadow-xl border p-6",
            )}
          >
            <div className="text-sm">
              <div className="gap-4 mb-4 flex flex-col text-sm">
                {installations.data?.installations && (
                  <Select
                    items={installations.data.installations.map(
                      (installation) => ({
                        value: installation.id.toString(),
                        label: installation.account.login,
                      }),
                    )}
                    placeholder="Select a GitHub namespace"
                    onChange={setInstallationId}
                    value={installationId}
                    btnClassName="w-full bg-sky-50 py-2 rounded border"
                  />
                )}

                <div className="justify-end flex flex-col gap-1">
                  {!repos.isFetching &&
                    repos.data?.repositories.map((repo) => (
                      <div
                        key={repo.id}
                        className={clsx(
                          "w-full p-2 rounded border text-left flex items-center",
                          "bg-white",
                        )}
                      >
                        <img
                          src={repo.owner.avatar_url}
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
                            {repositoryId === repo.full_name.toString() && (
                              <div className="flex justify-center">
                                <SpinnerLoader size="xs" />
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}

                  {installationId && repos.isFetching && (
                    <div className="w-full p-2 rounded border text-slate-500 flex justify-center">
                      <SpinnerLoader size="xs" />
                    </div>
                  )}

                  {(!installationId || (!repos.data && !repos.isFetching)) && (
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
                    onClose: onCloseRepositoryPopup,
                  })
                }
              >
                Adjust GitHub App Permissions →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
