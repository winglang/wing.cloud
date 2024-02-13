import { GlobeAltIcon, BoltIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useCallback, useContext } from "react";
import { Link } from "react-router-dom";

import { useTheme } from "../../../../../design-system/theme-provider.js";
import type { Endpoint } from "../../../../../utils/wrpc.js";
import { useTimeAgo } from "../../../../../utils/time.js";
import { useNotifications } from "../../../../../design-system/notification.js";
import {
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

export const EndpointItem = ({
  endpoint,
  onClick,
}: {
  endpoint: Endpoint;
  onClick: (endpoint: Endpoint) => void;
}) => {
  const { theme } = useTheme();
  const updatedAt = useTimeAgo(endpoint.updatedAt);
  const { showNotification } = useNotifications();

  const copyEndpointLink = useCallback(() => {
    navigator.clipboard.writeText(endpoint.publicUrl);
    showNotification("Copied to clipboard");
  }, [endpoint.publicUrl, showNotification]);

  return (
    <button
      className={clsx(
        "rounded-md p-4 text-left w-full block",
        theme.bgInput,
        "border",
        theme.borderInput,
        "shadow-sm hover:shadow cursor-default",
        "relative",
      )}
      onClick={() => onClick}
    >
      <div className="flex items-center gap-x-4">
        <div className="relative">
          {endpoint.browserSupport && (
            <GlobeAltIcon
              className="w-4 h-4 mr-1 text-violet-700 dark:text-violet-400"
              title="Website"
            />
          )}
          {!endpoint.browserSupport && (
            <BoltIcon
              className="w-4 h-4 mr-1 text-amber-500 dark:text-amber-400"
              title="Function"
            />
          )}
        </div>

        <div className="flex justify-between items-center truncate grow">
          <div className="text-xs space-y-1 truncate">
            <div
              className={clsx(
                "font-medium truncate relative",
                theme.text1,
                theme.text1Hover,
              )}
            >
              {endpoint.label}
            </div>

            <div className="truncate flex gap-x-2 sm:gap-x-5">
              <div
                className={clsx(
                  "truncate",
                  "flex gap-x-1 items-center",
                  "leading-5 py-0.5",
                  theme.text2,
                )}
              >
                <div className="flex gap-x-1 items-center">
                  <div className="group flex gap-x-1 items-center">
                    <Link
                      to={endpoint.publicUrl}
                      target="_blank"
                      className={clsx(
                        "truncate items-end flex font-mono",
                        theme.text2,
                        theme.text2Hover,
                        "hover:underline",
                      )}
                    >
                      {endpoint.publicUrl}
                    </Link>
                    <DocumentDuplicateIcon
                      className={clsx(
                        "transition-all",
                        "cursor-pointer",
                        theme.text3,
                        theme.text3Hover,
                        "w-0 h-0 group-hover:block group-hover:w-4 group-hover:h-4",
                        "z-10",
                      )}
                      onClick={copyEndpointLink}
                    />
                  </div>
                  <span
                    className={clsx(
                      "truncate items-center flex opacity-70",
                      "transition-all",
                      theme.text2,
                    )}
                  >
                    updated {updatedAt}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-x-4 text-xs items-center justify-end">
            <Link
              to={endpoint.publicUrl}
              target="_blank"
              className={clsx(
                theme.text2,
                theme.text3Hover,
                theme.bg4Hover,
                "transition-all",
                "z-10 rounded-full p-1.5",
              )}
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </button>
  );
};
