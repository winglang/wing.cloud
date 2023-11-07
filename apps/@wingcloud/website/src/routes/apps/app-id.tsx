import { BuildingStorefrontIcon, LinkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Header } from "../../components/header.js";
import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { getTimeFromNow } from "../../utils/time.js";
import { wrpc, type Environment } from "../../utils/wrpc.js";

const EnvironmentItem = ({ environment }: { environment: Environment }) => {
  const status = environment.status;
  const testStatus = environment.testResults?.status;

  return (
    <div className="flex justify-between items-center truncate">
      <div className="text-xs">
        {(environment.url && status === "running" && (
          <button
            className="hover:underline font-semibold truncate"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              window.open(environment.url, "_blank");
            }}
          >
            {environment.branch}
          </button>
        )) || (
          <div className="font-semibold truncate">{environment.branch}</div>
        )}

        <div className="text-slate-500 text-[10px] truncate">
          updated {getTimeFromNow(environment.updatedAt)}
        </div>
      </div>

      <div className="flex items-center justify-end gap-x-4">
        {testStatus && (
          <span
            className={clsx(
              // testStatus === "initializing" && "bg-yellow-200 text-yellow-800",
              // testStatus === "deploying" && "bg-blue-200 text-blue-800",
              testStatus === "running" && "bg-green-200 text-green-800",
              testStatus !== "running" && "bg-slate-200 text-slate-800",
              "inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full",
            )}
          >
            {testStatus}
          </span>
        )}
        <span
          className={clsx(
            // status === "initializing" && "bg-yellow-200 text-yellow-800",
            // status === "deploying" && "bg-blue-200 text-blue-800",
            status === "running" && "bg-green-200 text-green-800",
            status !== "running" && "bg-slate-200 text-slate-800",
            "inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full",
          )}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

export interface AppProps {
  appId: string;
}

export const Component = () => {
  const { appId } = useParams();
  if (!appId) return;

  const navigate = useNavigate();

  // TODO: useQuery should be able to use enabled: false as option
  const app = wrpc["app.get"].useQuery(
    { id: appId },
    // {
    //   enabled: false,
    // },
  );

  const repository = wrpc["github.getRepository"].useQuery(
    {
      owner: app.data?.app.repoOwner || "",
      repo: app.data?.app.repoName || "",
    },
    // {
    //   enabled: app.data?.app.repoOwner && app.data?.app.repoName,
    // },
  );

  const environments = wrpc["app.environments"].useQuery({ appId: appId });

  const loading = useMemo(() => {
    return app.isLoading || environments.isLoading;
  }, [app.isLoading, environments.isLoading]);

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Apps", to: "/apps" },
          {
            label: appId,
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
          <div className="flex gap-x-4 bg-white rounded p-2 shadow">
            <img
              src={app.data?.app.imageUrl}
              alt=""
              className="w-14 h-14 rounded-full"
            />
            <div className="text-slate-700 text-xl self-center truncate">
              {app.data?.app.name}
            </div>

            <div className="flex grow justify-end items-end truncate">
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
                  <button
                    key={environment.id}
                    className={clsx(
                      "bg-white rounded p-4 text-left w-full",
                      "shadow hover:shadow-md transition-all",
                    )}
                    onClick={() => {
                      navigate(`/apps/${environment.appId}/${environment.id}`);
                    }}
                  >
                    <EnvironmentItem
                      key={environment.id}
                      environment={environment}
                    />
                  </button>
                ))}
              </div>
            )}
        </div>
      )}
    </>
  );
};
