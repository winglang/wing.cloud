import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { EnvironmentsList } from "../environments/components/environments-list.js";
import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { Menu } from "../../design-system/menu.js";
import { GithubIcon } from "../../icons/github-icon.js";
import { MenuIcon } from "../../icons/menu-icon.js";
import { wrpc } from "../../utils/wrpc.js";

export interface AppProps {
  appName: string;
}

export const Component = () => {
  const { appName } = useParams();
  const navigate = useNavigate();

  const appQuery = wrpc["app.getByName"].useQuery({ appName: appName! });

  const app = useMemo(() => {
    return appQuery.data?.app;
  }, [appQuery.data]);

  const environmentsQuery = wrpc["app.environments"].useQuery(
    { appId: app?.appId! },
    {
      enabled: app !== undefined,
      refetchInterval: 1000 * 10,
    },
  );
  const environments = useMemo(() => {
    return (
      environmentsQuery.data?.environments.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ) || []
    );
  }, [environmentsQuery.data]);

  const repositoryQuery = wrpc["github.getRepository"].useQuery(
    {
      owner: app?.repoOwner || "",
      repo: app?.repoName || "",
    },
    {
      enabled: app != undefined,
    },
  );
  const repoUrl = useMemo(() => {
    return repositoryQuery.data?.repository.html_url || "";
  }, [repositoryQuery.data]);

  const deleteAppMutation = wrpc["app.delete"].useMutation();
  const deleteApp = useCallback(() => {
    deleteAppMutation.mutateAsync({ appId: app?.appId! });
  }, [app?.appId, deleteAppMutation]);

  return (
    <>
      {!app && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}

      {app && (
        <>
          <div className="flex gap-x-2 bg-white rounded p-4 shadow">
            <img src={app.imageUrl} alt="" className="w-14 h-14 rounded-full" />
            <div className="space-y-1 pt-2 truncate ml-2">
              <div className="text-slate-700 text-xl self-center truncate">
                {app.appName}
              </div>
              <div className="text-slate-500 text-xs self-center">
                {app.description === "" ? (
                  <div className="space-x-1 flex items-center">
                    <GithubIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate" title={app.lastCommitMessage}>
                      {app.lastCommitMessage?.split("\n")[0]}
                    </span>
                  </div>
                ) : (
                  app.description
                )}
              </div>
            </div>

            <div className="flex grow justify-end items-end">
              <div className="flex flex-col justify-between gap-3 h-full items-end">
                <Menu
                  items={[
                    {
                      label: "Delete App",
                      onClick: () => {
                        deleteApp();
                        navigate("/apps/");
                      },
                    },
                  ]}
                  icon={<MenuIcon className="h-4 w-4 text-slate-700" />}
                />

                {repoUrl && (
                  <a href={repoUrl + "/compare"} target="_blank">
                    <Button className="truncate">Git Repository</Button>
                  </a>
                )}
              </div>
            </div>
          </div>

          <EnvironmentsList
            environments={environments}
            loading={environmentsQuery.isLoading}
            appName={app.appName}
            repoUrl={repoUrl}
          />
        </>
      )}
    </>
  );
};
