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
        theme.focusVisible,
        "shadow-sm hover:shadow cursor-default",
        "relative",
      )}
      onClick={() => onClick}
    >
      <div className="flex items-center gap-x-4">
        {endpoint.browserSupport && (
          <GlobeAltIcon
            className="w-4 h-4 mr-1 text-violet-700 dark:text-violet-400 shrink-0"
            title="Website"
          />
        )}
        {!endpoint.browserSupport && (
          <BoltIcon
            className="w-4 h-4 mr-1 text-amber-500 dark:text-amber-400 shrink-0"
            title="Function"
          />
        )}

        <div className="flex justify-between items-center truncate grow">
          <div className="text-xs space-y-1 truncate w-full">
            <div
              className={clsx(
                "font-medium truncate relative",
                theme.text1,
                theme.text1Hover,
              )}
            >
              {endpoint.label}
            </div>

            <div
              className={clsx(
                "flex gap-x-1 items-center w-full",
                "sm:gap-x-5 truncate",
                "leading-5 py-0.5",
                theme.text2,
              )}
            >
              <div className="flex gap-x-1 w-full">
                <div className="group flex gap-x-1 items-center truncate">
                  <Link
                    to={endpoint.publicUrl}
                    target="_blank"
                    className={clsx(
                      "truncate items-end font-mono",
                      theme.text2,
                      theme.text2Hover,
                      "hover:underline focus:underline outline-none",
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
                      "z-10 shrink-0",
                    )}
                    onClick={copyEndpointLink}
                  />
                </div>
                <div
                  className={clsx(
                    "truncate items-center opacity-70",
                    "transition-all",
                    theme.text2,
                  )}
                >
                  updated {updatedAt}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-x-4 text-xs items-center justify-end mx-0.5">
            <Link
              to={endpoint.publicUrl}
              target="_blank"
              className={clsx(
                theme.text2,
                theme.text3Hover,
                theme.bg4Hover,
                theme.focusVisible,
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
