import { LinkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { EnvironmentItem } from "../../components/environment-item.js";
import { Header } from "../../components/header.js";
import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { GithubIcon } from "../../icons/github-icon.js";
import { wrpc } from "../../utils/wrpc.js";

export interface AppProps {
  appId: string;
}

export const Component = () => {
  const { appId } = useParams();

  const navigate = useNavigate();

  // TODO: Feels cleaner to separate in different components so we don't have to use the `enabled` option.
  const app = wrpc["app.get"].useQuery(
    { id: appId! },
    {
      enabled: appId != "",
    },
  );

  const repository = wrpc["github.getRepository"].useQuery(
    {
      owner: app.data?.app.repoOwner || "",
      repo: app.data?.app.repoName || "",
    },
    {
      enabled: app.data?.app.repoOwner != "" && app.data?.app.repoName != "",
    },
  );

  const environments = wrpc["app.environments"].useQuery(
    { appId: appId! },
    {
      enabled: appId != "",
    },
  );

  const loading = useMemo(() => {
    return app.isLoading || environments.isLoading;
  }, [app.isLoading, environments.isLoading]);

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Apps", to: "/apps" },
          {
            label: appId || "",
            to: `/apps/${appId}`,
          },
        ]}
      />

      {loading && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}

      {!loading && (
        <div className="p-6 space-y-4 w-full max-w-5xl mx-auto">
          <div className="flex gap-x-2 bg-white rounded p-4 shadow">
            <img
              src={app.data?.app.imageUrl}
              alt=""
              className="w-14 h-14 rounded-full"
            />
            <div className="space-y-1 pt-2 truncate ml-2">
              <div className="text-slate-700 text-xl self-center truncate">
                {app.data?.app.name}
              </div>
              <div className="text-slate-500 text-xs self-center truncate">
                {app.data?.app.description === "" ? (
                  <div className="space-x-1 flex items-center">
                    <GithubIcon className="h-3" />
                    <span>{app.data?.app.lastCommitMessage}</span>
                  </div>
                ) : (
                  app.data?.app.description
                )}
              </div>
            </div>

            <div className="flex grow justify-end items-end">
              <Button
                className="truncate"
                transparent
                onClick={() => {
                  window.open(repository.data?.repository.html_url, "_blank");
                }}
              >
                Git Repository
              </Button>
            </div>
          </div>

          {!environments.isLoading &&
            environments.data?.environments.length === 0 && (
              <div className="text-center bg-white p-6 w-full">
                <LinkIcon className="w-8 h-8 mx-auto text-slate-400" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  No preview environments found.
                </h3>

                <div>
                  <p className="mt-1 text-sm text-slate-500">
                    Get started by{" "}
                    <a
                      className="text-blue-600 hover:underline"
                      href={`${repository.data?.repository.html_url}/compare/main...${app.data?.app.repoOwner}:${app.data?.app.repoBranch}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      opening a Pull Request
                    </a>
                    .
                  </p>
                </div>
              </div>
            )}

          {environments.data?.environments &&
            environments.data?.environments.length > 0 && (
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
                    to={`/apps/${appId}/${environment.id}`}
                  >
                    <EnvironmentItem
                      key={environment.id}
                      environment={environment}
                    />
                  </Link>
                ))}
              </div>
            )}
        </div>
      )}
    </>
  );
};
