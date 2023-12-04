import clsx from "clsx";

import { SpinnerLoader } from "../../../../../components/spinner-loader.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import type { Endpoint } from "../../../../../utils/wrpc.js";

export interface EndpointsProps {
  id: string;
  isOpen: boolean;
  endpoints: Endpoint[];
  loading?: boolean;
}

export const Endpoints = ({
  id,
  isOpen,
  endpoints,
  loading,
}: EndpointsProps) => {
  const { theme } = useTheme();

  return (
    <div
      className={clsx(
        "w-full rounded border",
        theme.bgInput,
        theme.borderInput,
      )}
    >
      <button
        id={id}
        className={clsx(
          "flex items-center justify-between w-full text-left p-4 outline-none",
          isOpen && "border-b rounded-t shadow-sm",
          !isOpen && "rounded",
          theme.borderInput,
          theme.textInput,
          loading && "cursor-not-allowed opacity-50",
        )}
      >
        <div className="flex items-center flex-grow gap-2">
          <div className="font-medium text-sm">Endpoints</div>
        </div>
      </button>

      {isOpen && (
        <>
          {loading && (
            <div className="flex items-center justify-center p-4">
              <SpinnerLoader size="sm" />
            </div>
          )}
          {!loading && (
            <div className="text-2xs font-mono">
              {endpoints.length === 0 && (
                <div className={clsx(theme.text2, "w-full py-0.5 text-center")}>
                  No Endpoints.
                </div>
              )}
              {endpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className="flex flex-grow flex-row m-4 gap-4 sm:gap-6 transition-all w-full mb-2"
                >
                  <div className="flex flex-col gap-1 truncate w-1/3">
                    <div className={clsx("text-xs", theme.text2)}>Type</div>
                    <div
                      className={clsx(
                        "truncate text-xs font-medium",
                        theme.text1,
                        "h-5 flex",
                      )}
                    >
                      {endpoint.type.replace("@winglang/sdk.", "")}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 w-1/3">
                    <div className={clsx("text-xs", theme.text2)}>Path</div>
                    <div
                      className={clsx(
                        "truncate text-xs font-medium",
                        theme.text1,
                        "h-5 flex",
                      )}
                    >
                      <span>{endpoint.path}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 w-1/3">
                    <div className={clsx("text-xs", theme.text2)}>URL</div>
                    <div
                      className={clsx(
                        "truncate text-xs font-medium",
                        theme.text1,
                        "h-5 flex",
                      )}
                    >
                      <a
                        className="hover:underline truncate h-full"
                        href={endpoint.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {endpoint.publicUrl}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
