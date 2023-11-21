import clsx from "clsx";
import { Link } from "react-router-dom";

import { Button } from "../../../design-system/button.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { getDateTime } from "../../../utils/time.js";
import type { Environment } from "../../../utils/wrpc.js";

import { InfoItem } from "./info-item.js";

export interface InfoItemProps {
  loading?: boolean;
  environment?: Environment;
}

export const EnvironmentDetails = ({ loading, environment }: InfoItemProps) => {
  const { theme } = useTheme();

  return (
    <div
      className={clsx(
        "p-6 w-full rounded gap-4 flex border",
        theme.bgInput,
        theme.borderInput,
      )}
    >
      <div className="flex flex-grow flex-col gap-4 sm:gap-6 truncate transition-all">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 transition-all">
          <InfoItem
            label="Branch"
            loading={loading}
            value={
              <a
                className="hover:underline truncate w-full h-full"
                href={`https://github.com/${environment?.repo}/tree/${environment?.branch}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {environment?.branch}
              </a>
            }
          />

          <InfoItem
            label="Environment"
            loading={loading}
            value={
              <div className="rounded-lg px-2 py-0.5 capitalize bg-slate-100 dark:bg-slate-750 text-center truncate">
                {environment?.type}
              </div>
            }
          />

          <InfoItem
            label="Status"
            loading={loading}
            value={
              <div className="flex items-center truncate">
                <div
                  title={environment?.status}
                  className={clsx(
                    "w-2.5 h-2.5",
                    "rounded-full shrink-0",
                    environment?.status === "initializing" &&
                      "bg-slate-400 animate-pulse",
                    environment?.status === "tests" &&
                      "bg-yellow-300 animate-pulse",
                    environment?.status === "deploying" &&
                      "bg-yellow-300 animate-pulse",
                    environment?.status === "running" && "bg-green-300",
                    environment?.status === "error" && "bg-red-300",
                  )}
                />
                <div className="rounded-xl px-2 py-0.5 capitalize truncate">
                  {environment?.status}
                </div>
              </div>
            }
          />

          <InfoItem
            label="Created"
            loading={loading}
            value={environment && getDateTime(environment?.createdAt)}
          />

          <div className="col-span-2 sm:col-span-3 transition-all">
            <InfoItem
              label="URLs"
              loading={loading}
              value={
                <div className="truncate">
                  <a
                    className="hover:underline truncate font-mono"
                    href={`https://github.com/${environment?.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {`https://github.com/${environment?.repo}`}
                  </a>
                </div>
              }
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end items-start">
        <Link to="./preview">
          <Button disabled={environment?.status !== "running"}>Visit</Button>
        </Link>
      </div>
    </div>
  );
};
