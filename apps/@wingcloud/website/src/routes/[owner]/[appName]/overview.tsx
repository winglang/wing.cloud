import {
  MagnifyingGlassCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { SectionTitle } from "../../../components/section-title.js";
import { Input } from "../../../design-system/input.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { wrpc } from "../../../utils/wrpc.js";

import { EnvironmentDetails } from "./[branch]/_components/environment-details.js";
import { EnvironmentsListItemSkeleton } from "./_components/environments-list-item-skeleton.js";
import { EnvironmentsListItem } from "./_components/environments-list-item.js";
import { BranchIcon } from "../../../icons/branch-icon.js";
import { PageHeader } from "../../../components/page-header.js";
import { GithubIcon } from "../../../icons/github-icon.js";
import { AppIcon } from "../_components/app-icon.js";

const OverviewPage = ({
  owner,
  appName,
}: {
  owner: string;
  appName: string;
}) => {
  const getAppQuery = wrpc["app.getByName"].useQuery(
    {
      owner: owner!,
      appName: appName!,
    },
    {
      enabled: !!owner && !!appName,
    },
  );
  const app = useMemo(() => {
    return getAppQuery.data?.app;
  }, [getAppQuery.data]);

  const navigate = useNavigate();

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
  const endpoints = useMemo(() => {
    if (!endpointsQuery.data) {
      return [];
    }
    return endpointsQuery.data?.endpoints.sort((a, b) => {
      return a.label.localeCompare(b.label);
    });
  }, [endpointsQuery.data]);

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
    return previewEnvs
      .filter((env) =>
        `${env.prTitle}${env.branch}${env.status}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase()),
      )
      .reverse();
  }, [previewEnvs, search]);

  const repoUrl = useMemo(() => {
    if (!app) return;
    return `https://github.com/${app?.repoOwner}/${app?.repoName}`;
  }, [app]);

  return (
    <>
      <PageHeader
        title={appName}
        icon={
          <AppIcon
            appName={appName}
            entrypoint={app?.entrypoint}
            classNames="size-full"
          />
        }
        noBackground
        actions={
          <>
            {app?.repoOwner && app?.repoName && (
              <Link
                to={`https://github.com/${app.repoOwner}/${app.repoName}`}
                onClick={(e) => {
                  if (app?.repoName == "") {
                    e.preventDefault();
                  }
                }}
                className={clsx(
                  "inline-flex gap-2 items-center text-xs font-medium outline-none rounded-md",
                  "px-2.5 py-2 border shadow-sm",
                  theme.borderInput,
                  theme.focusVisible,
                  theme.bgInput,
                  theme.bgInputHover,
                  theme.textInput,
                )}
                target="_blank"
              >
                <GithubIcon className="size-4" />
                <div className="hidden sm:block">
                  {app.repoOwner}/{app.repoName}
                </div>
              </Link>
            )}
          </>
        }
      />
      <div
        className={clsx(
          "space-y-4 pb-4",
          "relative transition-all",
          theme.pageMaxWidth,
          theme.pagePadding,
        )}
      >
        <div className="space-y-2">
          <SectionTitle>Production</SectionTitle>
          <EnvironmentDetails
            owner={owner}
            app={app}
            environment={productionEnvironment}
            loading={loading}
            endpoints={endpoints}
            endpointsLoading={
              endpointsQuery.isLoading || endpointsQuery.data === undefined
            }
            onClick={() => {
              if (!productionEnvironment?.branch) {
                return;
              }
              navigate(`/${owner}/${appName}/${productionEnvironment.branch}`);
            }}
            actions={
              <div
                className={clsx(
                  "transition-all",
                  "rounded-full p-1.5",
                  "sm:opacity-0 group-hover:opacity-100",
                  "sm:-translate-y-2 group-hover:translate-y-0",
                )}
              >
                <ArrowRightIcon className="w-4 h-4" />
              </div>
            }
          />
        </div>

        <div className="space-y-2">
          <SectionTitle>Preview Environments</SectionTitle>

          {loading && <EnvironmentsListItemSkeleton short />}

          {!loading && (
            <>
              {previewEnvs.length > 0 && (
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
                    className={clsx("w-10 h-10 mx-auto", theme.text3)}
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
                    {previewEnvs.length === 0 && (
                      <span>
                        Get started by{" "}
                        <a
                          className="text-sky-500 hover:underline focus:underline hover:text-sky-600 outline-none"
                          href={`${repoUrl}/compare`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (repoUrl === "") {
                              e.preventDefault();
                            }
                          }}
                        >
                          opening a Pull Request
                        </a>
                        .
                      </span>
                    )}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export const Component = () => {
  const { owner, appName } = useParams();

  return <OverviewPage owner={owner!} appName={appName!} />;
};
