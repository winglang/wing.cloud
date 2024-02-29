import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { GlobeAltIcon, BoltIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useCallback } from "react";
import { Link } from "react-router-dom";

import { ButtonLink } from "../../../../../design-system/button-link.js";
import { useNotifications } from "../../../../../design-system/notification.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { useTimeAgo } from "../../../../../utils/time.js";
import type { Endpoint } from "../../../../../utils/wrpc.js";

export const EndpointItem = ({ endpoint }: { endpoint: Endpoint }) => {
  const { theme } = useTheme();
  const updatedAt = useTimeAgo(endpoint.updatedAt);
  const { showNotification } = useNotifications();

  const copyEndpointLink = useCallback(() => {
    navigator.clipboard.writeText(endpoint.publicUrl);
    showNotification("Copied to clipboard");
  }, [endpoint.publicUrl, showNotification]);

  return (
    <div
      className={clsx(
        "rounded-md p-4 text-left w-full block",
        theme.bgInput,
        "border",
        theme.borderInput,
        theme.focusVisible,
        "shadow-sm hover:shadow",
        "relative",
      )}
    >
      <Link
        to={endpoint.publicUrl}
        target="_blank"
        className={clsx(
          "-m-px",
          "absolute inset-0 cursor-pointer rounded-md border",
          theme.focusVisible,
          theme.borderInput,
        )}
      />

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
                "font-medium truncate",
                theme.text1,
                theme.text1Hover,
              )}
            >
              {endpoint.label}
            </div>

            <div
              className={clsx(
                "flex gap-x-2 items-center w-full",
                "sm:gap-x-5 truncate",
                "leading-5 py-0.5",
                theme.text2,
              )}
            >
              <div className="flex gap-x-1 w-full">
                <button
                  className={clsx(
                    "z-10",
                    theme.text3,
                    theme.text3Hover,
                    "group flex items-center truncate",
                    "outline-none focus-visible:underline",
                    "gap-x-1",
                  )}
                  onClick={copyEndpointLink}
                >
                  <div className="truncate">{endpoint.publicUrl}</div>
                  <DocumentDuplicateIcon
                    className={clsx(
                      "transition-all",
                      "cursor-pointer",
                      "w-0 h-0 group-hover:block group-hover:w-4 group-hover:h-4",
                      "shrink-0",
                    )}
                  />
                </button>
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
        </div>
      </div>
    </div>
  );
};
