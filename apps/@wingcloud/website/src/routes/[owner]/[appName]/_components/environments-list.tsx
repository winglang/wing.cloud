import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";

import { Duplicator } from "../../../../components/duplicator.js";
import { Input } from "../../../../design-system/input.js";
import { useTheme } from "../../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../../icons/branch-icon.js";
import { ConsolePreviewIcon } from "../../../../icons/console-preview-icon.js";
import type { Environment } from "../../../../utils/wrpc.js";

import { EnvironmentsListItemSkeleton } from "./environments-list-item-skeleton.js";
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
    <div className="space-y-4">
      <div className="space-y-2">
        <div className={clsx("text-lg pt-2", theme.text1)}>Production</div>

        {productionEnvs.length === 0 && <EnvironmentsListItemSkeleton />}
        {productionEnvs.length > 0 &&
          productionEnvs.map((environment) => (
            <div key={environment.id}>
              <EnvironmentsListItem
                key={environment.id}
                owner={owner}
                appName={appName}
                environment={environment}
              />
            </div>
          ))}
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
  );
};
