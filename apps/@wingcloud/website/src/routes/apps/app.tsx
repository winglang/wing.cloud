import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { EnvironmentsList } from "../../components/environments-list.js";
import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { GithubIcon } from "../../icons/github-icon.js";
import { wrpc } from "../../utils/wrpc.js";

export interface AppProps {
  appName: string;
}

export const Component = () => {
  const { appName } = useParams();

  // TODO: Feels cleaner to separate in different components so we don't have to use the `enabled` option.
  const app = wrpc["app.getByName"].useQuery({ appName: appName! });

  const appId = useMemo(() => {
    return app.data?.app?.appId.toString();
  }, [app.data]);

  const environments = wrpc["app.environments"].useQuery(
    { appId: appId! },
    {
      enabled: appId != "",
    },
  );

  const { repoOwner, repoName } = app.data?.app || {};
  const repository = wrpc["github.getRepository"].useQuery(
    {
      owner: repoOwner || "",
      repo: repoName || "",
    },
    {
      enabled: !!repoOwner && !!repoName,
    },
  );

  const loading = useMemo(() => {
    return app.isLoading || environments.isLoading || repository.isLoading;
  }, [app.isLoading, environments.isLoading, repository.isLoading]);

  return (
    <>
      {loading && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}

      {!loading && app.data && environments.data && repository.data && (
        <>
          <div className="flex gap-x-2 bg-white rounded p-4 shadow">
            <img
              src={app.data.app.imageUrl}
              alt=""
              className="w-14 h-14 rounded-full"
            />
            <div className="space-y-1 pt-2 truncate ml-2">
              <div className="text-slate-700 text-xl self-center truncate">
                {app.data.app.appName}
              </div>
              <div className="text-slate-500 text-xs self-center">
                {app.data.app.description === "" ? (
                  <div className="space-x-1 flex items-center">
                    <GithubIcon className="h-3 w-3 shrink-0" />
                    <span
                      className="truncate"
                      title={app.data.app.lastCommitMessage}
                    >
                      {app.data.app.lastCommitMessage?.split("\n")[0]}
                    </span>
                  </div>
                ) : (
                  app.data.app.description
                )}
              </div>
            </div>

            <div className="flex grow justify-end items-end">
              {repository.data.repository && (
                <a
                  href={repository.data.repository.html_url + "/compare"}
                  target="_blank"
                >
                  <Button className="truncate">Git Repository</Button>
                </a>
              )}
            </div>
          </div>

          <EnvironmentsList
            environments={environments.data.environments}
            appName={app.data.app.appName}
            repoUrl={repository.data.repository.html_url}
          />
        </>
      )}
    </>
  );
};
