import { LinkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { EnvironmentListItem } from "../../components/environment-list-item.js";
import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { GithubIcon } from "../../icons/github-icon.js";
import { wrpc } from "../../utils/wrpc.js";

export interface AppProps {
  appName: string;
}

export const Component = () => {
  const { appName } = useParams();

  const navigate = useNavigate();

  // TODO: Feels cleaner to separate in different components so we don't have to use the `enabled` option.
  const app = wrpc["app.getByName"].useQuery(
    { appName: appName! },
    {
      enabled: appName != "",
    },
  );

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

          {environments.data.environments.length === 0 && (
            <div className="text-center bg-white p-6 w-full">
              <LinkIcon className="w-8 h-8 mx-auto text-slate-400" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                No preview environments found.
              </h3>

              <p className="mt-1 text-sm text-slate-500 flex gap-x-1 w-full justify-center">
                <span>Get started by</span>
                <a
                  className="text-blue-600 hover:underline"
                  href={`${repository.data.repository.html_url}/compare`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  opening a Pull Request
                </a>
                .
              </p>
            </div>
          )}

          {environments.data.environments.length > 0 && (
            <div className="space-y-2">
              <div className="text-slate-700 text-lg pt-2">
                Preview Environments
              </div>
              {environments.data.environments.map((environment) => (
                <Link
                  key={environment.id}
                  className={clsx(
                    "bg-white rounded p-4 text-left w-full block",
                    "shadow hover:shadow-md transition-all",
                  )}
                  to={`/apps/${appName}/${environment.id}`}
                >
                  <EnvironmentListItem
                    key={environment.id}
                    environment={environment}
                  />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};
