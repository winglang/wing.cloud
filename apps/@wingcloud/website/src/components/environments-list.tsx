import { LinkIcon } from "@heroicons/react/24/outline";

import type { Environment } from "../utils/wrpc.js";

import { EnvironmentsListItem } from "./environments-list-item.js";
import { SpinnerLoader } from "./spinner-loader.js";

export interface EnvironmentsListProps {
  environments: Environment[];
  appName: string;
  repoUrl: string;
  loading?: boolean;
}

export const EnvironmentsList = ({
  environments,
  appName,
  repoUrl,
  loading,
}: EnvironmentsListProps) => {
  return (
    <>
      {loading && (
        <div className="bg-white p-6 w-full flex items-center justify-center">
          <SpinnerLoader size="sm" />
        </div>
      )}

      {!loading && environments.length === 0 && (
        <div className="text-center bg-white p-6 w-full">
          <LinkIcon className="w-8 h-8 mx-auto text-slate-400" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">
            No preview environments found.
          </h3>

          <p className="mt-1 text-sm text-slate-500 flex gap-x-1 w-full justify-center">
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
        <div className="space-y-2">
          <div className="text-slate-700 text-lg pt-2">
            Preview Environments
          </div>
          {environments.map((environment) => (
            <EnvironmentsListItem
              key={environment.id}
              appName={appName}
              environment={environment}
            />
          ))}
        </div>
      )}
    </>
  );
};
