import { LinkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";

import { SpinnerLoader } from "../../../../components/spinner-loader.js";
import { Input } from "../../../../design-system/input.js";
import { useTheme } from "../../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../../icons/branch-icon.js";
import type { Environment } from "../../../../utils/wrpc.js";

import { EnvironmentsListItem } from "./environments-list-item.js";

export interface EnvironmentsListProps {
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
      {loading && (
        <div className="p-6 w-full flex items-center justify-center">
          <SpinnerLoader />
        </div>
      )}

      {!loading && environments.length === 0 && (
        <div
          className={clsx(
            "text-center p-6 w-ful border",
            theme.bgInput,
            theme.borderInput,
          )}
        >
          <LinkIcon className={clsx("w-8 h-8 mx-auto", theme.text2)} />
          <h3 className={clsx("mt-2 text-sm font-medium", theme.text1)}>
            No preview environments found.
          </h3>

          <p
            className={clsx(
              "mt-1 text-sm flex gap-x-1 w-full justify-center",
              theme.text2,
            )}
          >
            <span>Get started by</span>
            <a
              className="text-blue-600 hover:underline"
              href={`${repoUrl}/compare`}
              target="_blank"
              rel="noopener noreferrer"
            >
              opening a Pull Request
            </a>
            .
          </p>
        </div>
      )}

      {environments.length > 0 && (
        <div className="space-y-4">
          {productionEnvs.length > 0 && (
            <div className="space-y-2">
              <div className={clsx("text-lg pt-2", theme.text1)}>
                Production
              </div>

              {productionEnvs.map((environment) => (
                <EnvironmentsListItem
                  key={environment.id}
                  owner={owner}
                  appName={appName}
                  environment={environment}
                />
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className={clsx("text-lg pt-2", theme.text1)}>
              Preview Environments
            </div>

            {previewEnvs.length > 0 && (
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
                <BranchIcon className="w-12 h-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No previews found.
                </h3>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
