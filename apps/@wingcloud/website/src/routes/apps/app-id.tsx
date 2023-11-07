import { Link, LinkIcon, PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Header } from "../../components/header.js";
import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { getTimeFromNow } from "../../utils/time.js";
import { wrpc, type Environment } from "../../utils/wrpc.js";

const EnvironmentItem = ({ environment }: { environment: Environment }) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <span
          className={clsx(
            environment.status === "initializing" &&
              "bg-yellow-200 text-yellow-800",
            environment.status === "running" && "bg-green-200 text-green-800",
            "text-xs font-semibold mr-2 px-2.5 py-0.5 rounded",
          )}
        >
          {environment.branch}
        </span>
        <span className="text-xs text-gray-500">
          updated {getTimeFromNow(environment.updatedAt)}
        </span>
      </div>
      <div className="flex items-center gap-x-4">
        <span
          className={clsx(
            environment.status === "initializing" &&
              "bg-yellow-200 text-yellow-800",
            environment.status === "running" && "bg-green-200 text-green-800",
            "inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full",
          )}
        >
          {environment.status}
        </span>

        {environment.testResults?.status && (
          <span
            className={clsx(
              environment.testResults.status === "initializing" &&
                "bg-yellow-200 text-yellow-800",
              environment.testResults.status === "running" &&
                "bg-green-200 text-green-800",
              "inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full",
            )}
          >
            {environment.testResults.status}
          </span>
        )}

        {environment.url && (
          <a
            href={environment.url}
            className="text-blue-600 hover:underline text-xs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit Preview
          </a>
        )}
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

  const environments = wrpc["app.environments"].useQuery({ id: appId });

  const loading = useMemo(() => {
    return app.isLoading || environments.isLoading;
  }, [app.isLoading, environments.isLoading]);

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Apps", to: "/apps" },
          {
            label: app.data?.app.name || "",
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
          <div className="flex gap-x-4 bg-white rounded p-4 shadow">
            <img
              src={app.data?.app.imageUrl}
              alt=""
              className="w-14 h-14 rounded-full"
            />
            <div className="text-slate-700 text-xl self-center">
              {app.data?.app.name}
            </div>

            <div className="flex grow justify-end items-end">
              <Button
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
              <div className="text-center">
                <LinkIcon className="w-12 h-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                  No environments found.
                </h3>

                <div>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by opening a Pull Request.
                  </p>

                  <Button
                    label="Open Pull Request"
                    icon={PlusIcon}
                    primary
                    className="mt-6"
                    onClick={() => {
                      window.open(
                        `${repository.data?.repository.html_url}/pulls`,
                        "_blank",
                      );
                    }}
                  />
                </div>
              </div>
            )}

          <div className="space-y-2">
            {environments.data?.environments.map((environment) => (
              <div className="bg-white rounded p-4 shadow">
                <EnvironmentItem
                  key={environment.id}
                  environment={environment}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
