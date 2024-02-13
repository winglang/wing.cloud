import { MagnifyingGlassCircleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../components/error-boundary.js";
import { Header } from "../../../components/header.js";
import { CurrentAppDataProviderContext } from "../../../data-store/current-app-data-provider.js";
import { Input } from "../../../design-system/input.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../icons/branch-icon.js";
import { wrpc } from "../../../utils/wrpc.js";

import { EnvironmentDetails } from "./[branch]/_components/environment-details.js";
import { EnvironmentsListItemSkeleton } from "./_components/environments-list-item-skeleton.js";
import { EnvironmentsListItem } from "./_components/environments-list-item.js";

const AppPage = ({ owner, appName }: { owner: string; appName: string }) => {
  const { app, setOwner, setAppName } = useContext(
    CurrentAppDataProviderContext,
  );
  useEffect(() => {
    setOwner(owner);
    setAppName(appName);
  }, [owner, appName]);

  const environmentsQuery = wrpc["app.listEnvironments"].useQuery(
    {
      owner: owner!,
      appName: appName!,
    },
    {
      enabled: !!owner && !!appName,
    },
  );

  const loading = useMemo(() => {
    return environmentsQuery.isLoading;
  }, [environmentsQuery]);

  const environments = useMemo(() => {
    return (
      environmentsQuery.data?.environments.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ) || []
    );
  }, [environmentsQuery.data]);

  const productionEnvironment = useMemo(() => {
    return environments.find((env) => env.type === "production");
  }, [environments]);

  const endpointsQuery = wrpc["app.environment.endpoints"].useQuery(
    {
      appName: appName!,
      branch: productionEnvironment?.branch!,
    },
    {
      enabled: !!appName && productionEnvironment?.status === "running",
    },
  );

  const { theme } = useTheme();

  const [search, setSearch] = useState("");

  const previewEnvs = useMemo(() => {
    if (!environments) {
      return [];
    }
    return environments.filter((env) => env.type === "preview");
  }, [environments, search]);

  const filteredPreviewEnvs = useMemo(() => {
    if (!previewEnvs) {
      return [];
    }
    return previewEnvs.filter((env) =>
      `${env.prTitle}${env.branch}${env.status}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
    );
  }, [previewEnvs, search]);

  const repoUrl = useMemo(() => {
    if (!app) return;
    return `https://github.com/${app?.repoOwner}/${app?.repoName}`;
  }, [app]);

  return (
    <div className="overflow-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-4">
        {owner && appName && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className={clsx("text-lg pt-2", theme.text1)}>
                Production
              </div>

              <EnvironmentDetails
                owner={owner}
                appName={appName}
                environment={productionEnvironment}
                loading={!productionEnvironment}
                endpoints={endpointsQuery.data?.endpoints}
                endpointsLoading={
                  endpointsQuery.isLoading || endpointsQuery.data === undefined
                }
              />
            </div>

            <div className="space-y-2">
              <div className={clsx("text-lg pt-2", theme.text1)}>
                Preview Environments
              </div>

              {loading && <EnvironmentsListItemSkeleton short />}

              {!loading && (
                <>
                  {filteredPreviewEnvs.length > 0 && (
                    <Input
                      type="text"
                      leftIcon={MagnifyingGlassCircleIcon}
                      className="block w-full"
                      containerClassName="w-full"
                      name="search"
                      id="search"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                      }}
                    />
                  )}

                  {filteredPreviewEnvs.map((environment) => (
                    <EnvironmentsListItem
                      key={environment.id}
                      owner={owner}
                      appName={appName}
                      environment={environment}
                    />
                  ))}

                  {filteredPreviewEnvs.length === 0 && (
                    <div
                      className={clsx(
                        "space-y-2",
                        "p-4 w-full border text-center rounded-md",
                        theme.bgInput,
                        theme.borderInput,
                        theme.text1,
                      )}
                    >
                      <BranchIcon
                        className={clsx("w-12 h-12 mx-auto", theme.text3)}
                      />
                      <h3 className={clsx("text-sm font-medium", theme.text2)}>
                        No preview environments found.
                      </h3>
                      <p
                        className={clsx(
                          "mt-1 text-sm flex gap-x-1 w-full justify-center",
                          theme.text3,
                        )}
                      >
                        <span>
                          Get started by{" "}
                          <a
                            className="text-sky-500 hover:underline hover:text-sky-600"
                            href={`${repoUrl}/compare`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-disabled={repoUrl === ""}
                          >
                            opening a Pull Request
                          </a>
                          .
                        </span>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Component = () => {
  const { owner, appName } = useParams();

  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[{ label: appName!, to: `/${owner}/${appName}` }]}
        tabs={[
          {
            name: "Application",
            to: `/${owner}/${appName}`,
          },
          {
            name: "Settings",
            to: `/${owner}/${appName}/settings`,
          },
        ]}
      />
      <ErrorBoundary>
        <AppPage owner={owner!} appName={appName!} />
      </ErrorBoundary>
    </div>
  );
};
