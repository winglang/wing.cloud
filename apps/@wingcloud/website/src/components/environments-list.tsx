import { LinkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Link } from "react-router-dom";

import type { Environment } from "../utils/wrpc.js";

import { EnvironmentsListItem } from "./environments-list-item.js";

export interface EnvironmentsListProps {
  environments: Environment[];
  appName: string;
  repoUrl: string;
}

export const EnvironmentsList = ({
  environments,
  appName,
  repoUrl,
}: EnvironmentsListProps) => {
  return (
    <>
      {environments.length === 0 && (
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
            <Link
              key={environment.id}
              className={clsx(
                "bg-white rounded p-4 text-left w-full block",
                "shadow hover:shadow-md transition-all",
              )}
              to={`/apps/${appName}/${environment.id}`}
            >
              <EnvironmentsListItem
                key={environment.id}
                environment={environment}
              />
            </Link>
          ))}
        </div>
      )}
    </>
  );
};
