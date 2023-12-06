import { LinkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";

import { SpinnerLoader } from "../../../../components/spinner-loader.js";
import { Input } from "../../../../design-system/input.js";
import { useTheme } from "../../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../../icons/branch-icon.js";
import type { Environment } from "../../../../utils/wrpc.js";

import { EnvironmentsListItem } from "./environments-list-item.js";

interface EnvironmentsListProps {
  environments: Environment[];
  owner: string;
  appName: string;
  repoUrl: string;
  loading?: boolean;
}

export const EnvironmentsList = ({
  environments,
  owner,
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
      <div className="space-y-4">
        <div className="space-y-2">
          <div className={clsx("text-lg pt-2", theme.text1)}>Production</div>

          {productionEnvs.length === 0 && (
            <div
              className={clsx(
                "rounded p-4 text-left w-full block",
                theme.bgInput,
                "border",
                theme.borderInput,
              )}
            >
              <div className="p-6 w-full flex items-center justify-center">
                <SpinnerLoader size="sm" />
              </div>
            </div>
          )}

          {productionEnvs.length > 0 &&
            productionEnvs.map((environment) => (
              <EnvironmentsListItem
                key={environment.id}
                owner={owner}
                appName={appName}
                environment={environment}
              />
            ))}
        </div>

        <div className="space-y-2">
          <div className={clsx("text-lg pt-2", theme.text1)}>
            Preview Environments
          </div>

          {loading && (
            <div
              className={clsx(
                "rounded p-4 text-left w-full block",
                theme.bgInput,
                "border",
                theme.borderInput,
              )}
            >
              <div className="p-6 w-full flex items-center justify-center">
                <SpinnerLoader size="sm" />
              </div>
            </div>
          )}

          {!loading && (
            <>
              {filteredPreviewEnvs.length > 0 && (
                <Input
                  type="text"
                  leftIcon={MagnifyingGlassIcon}
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
                    "p-4 w-full border text-center rounded",
                    theme.bgInput,
                    theme.borderInput,
                    theme.text1,
                  )}
                >
                  <BranchIcon className="w-12 h-12 mx-auto text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900">
                    No previews found.
                  </h3>

                  <p
                    className={clsx(
                      "mt-1 text-sm flex gap-x-1 w-full justify-center",
                      theme.text2,
                    )}
                  >
                    <span>
                      Get started by{" "}
                      <a
                        className="text-blue-600 hover:underline"
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
    </>
  );
};
