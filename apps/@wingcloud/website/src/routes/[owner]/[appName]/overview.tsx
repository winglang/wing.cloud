import {
  MagnifyingGlassCircleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { SectionTitle } from "../../../components/section-title.js";
import { CurrentAppDataProviderContext } from "../../../data-store/current-app-data-provider.js";
import { Input } from "../../../design-system/input.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../icons/branch-icon.js";
import { wrpc } from "../../../utils/wrpc.js";

import { EnvironmentDetails } from "./[branch]/_components/environment-details.js";
import { EnvironmentsListItemSkeleton } from "./_components/environments-list-item-skeleton.js";
import { EnvironmentsListItem } from "./_components/environments-list-item.js";

const OverviewPage = ({
  owner,
  appName,
}: {
  owner: string;
  appName: string;
}) => {
  const { app, setOwner, setAppName } = useContext(
    CurrentAppDataProviderContext,
  );
  useEffect(() => {
    setOwner(owner);
    setAppName(appName);
  }, [owner, appName]);

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
    <div className="space-y-4">
      <div className="space-y-2">
        <SectionTitle>Production</SectionTitle>
        <EnvironmentDetails
          owner={owner}
          appName={appName}
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
            <>
              {productionEnvironment?.branch && (
                <Link
                  to={`/${owner}/${appName}/${productionEnvironment.branch}`}
                  className={clsx(
                    theme.text2,
                    theme.text1Hover,
                    theme.bg4Hover,
                    "transition-all",
                    "absolute z-10 rounded-full p-1.5 right-4 top-4",
                    "opacity-0 group-hover:opacity-100",
                  )}
                >
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              )}
            </>
          }
        />
      </div>

      <div className="space-y-2">
        <SectionTitle>Preview Environments</SectionTitle>

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
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const Component = () => {
  const { owner, appName } = useParams();

  return <OverviewPage owner={owner!} appName={appName!} />;
};
