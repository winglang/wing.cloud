import { LinkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";

import { SpinnerLoader } from "../../../components/spinner-loader.js";
import { Input } from "../../../design-system/input.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../icons/branch-icon.js";
import type { Environment } from "../../../utils/wrpc.js";

import { EnvironmentsListItem } from "./environments-list-item.js";

export interface EnvironmentsListProps {
  environments: Environment[];
  appName: string;
  repoUrl?: string;
  loading?: boolean;
}

export const EnvironmentsList = ({
  environments,
  appName,
  repoUrl,
  loading,
}: EnvironmentsListProps) => {
  const { theme } = useTheme();

  const [search, setSearch] = useState("");

  const productionEnvs = useMemo(() => {
    if (!environments) {
      return [];
    }
    return environments.filter((env) => env.type === "production");
  }, [environments, search]);

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

  return (
    <>
      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <div className={clsx("text-lg", theme.text1)}>Production</div>

          {loading && (
            <div
              className={clsx(
                "p-4 w-full border text-center rounded",
                theme.bgInput,
                theme.borderInput,
                theme.text1,
              )}
            >
              <div className="flex items-center justify-center">
                <SpinnerLoader size="sm" />
              </div>
            </div>
          )}

          {!loading && productionEnvs.length === 0 && (
            <div
              className={clsx(
                "p-4 w-full border text-center rounded",
                theme.bgInput,
                theme.borderInput,
                theme.text1,
              )}
            >
              <BranchIcon className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-800">
                There's no production environment yet
              </h3>
            </div>
          )}

          {productionEnvs.map((environment) => (
            <EnvironmentsListItem
              key={environment.id}
              appName={appName}
              environment={environment}
            />
          ))}
        </div>

        <div className="space-y-2">
          <div className={clsx("text-lg", theme.text1)}>
            Preview Environments
          </div>

          <Input
            type="text"
            leftIcon={MagnifyingGlassIcon}
            className="block w-full"
            containerClassName="w-full"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />

          {loading && (
            <div
              className={clsx(
                "p-4 w-full border text-center rounded",
                theme.bgInput,
                theme.borderInput,
                theme.text1,
              )}
            >
              <div className="flex items-center justify-center">
                <SpinnerLoader size="sm" />
              </div>
            </div>
          )}

          {!loading && filteredPreviewEnvs.length === 0 && (
            <div
              className={clsx(
                "p-4 w-full border text-center rounded",
                theme.bgInput,
                theme.borderInput,
                theme.text1,
              )}
            >
              <BranchIcon className="w-12 h-12 mx-auto text-gray-400" />

              {search && (
                <>
                  <h3 className="mt-2 text-sm font-medium text-gray-800">
                    No previews found for the query "{search}".
                  </h3>
                  <p
                    className={clsx(
                      "mt-1 text-xs flex gap-x-1 w-full justify-center",
                      theme.text2,
                    )}
                  >
                    <span>
                      Try a different query or{" "}
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => setSearch("")}
                      >
                        clear the query
                      </button>
                      .
                    </span>
                  </p>
                </>
              )}

              {!search && (
                <>
                  <h3 className="mt-2 text-sm font-medium text-gray-800">
                    No previews found.
                  </h3>

                  <p
                    className={clsx(
                      "mt-1 text-xs flex gap-x-1 w-full justify-center",
                      theme.text2,
                    )}
                  >
                    <span>Get started by</span>
                    <span>
                      <a
                        className="text-blue-600 hover:underline"
                        href={`${repoUrl}/compare`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        opening a Pull Request
                      </a>
                      .
                    </span>
                  </p>
                </>
              )}
            </div>
          )}

          {filteredPreviewEnvs.map((environment) => (
            <EnvironmentsListItem
              key={environment.id}
              appName={appName}
              environment={environment}
            />
          ))}
        </div>
      </div>
    </>
  );
};
