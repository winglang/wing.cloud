import { ArrowSmallLeftIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useTheme } from "../design-system/theme-provider.js";

export const HttpErrorPage = ({
  title = "Error",
  message = "Something went wrong.",
  code,
}: {
  title?: string;
  message?: string;
  code?: number;
}) => {
  const { theme } = useTheme();

  const parsedMessage = useMemo(() => {
    if (!message.endsWith(".")) {
      return message + ".";
    }
  }, [message]);

  return (
    <div className="grid min-h-full place-items-center items-center px-6 py-24 sm:py-32 lg:px-8 h-full">
      <div className="text-center items-center">
        <p className={clsx("text-base font-semibold font-mono", theme.text1)}>
          {code}
        </p>
        <h1
          className={clsx(
            "mt-4 text-3xl font-bold tracking-tight sm:text-5xl",
            theme.text2,
          )}
        >
          {title}
        </h1>
        <p
          className={clsx(
            "mt-5 text-base leading-7 text-gray-600",
            theme.text1,
          )}
        >
          {parsedMessage}
        </p>
        <div className="mt-8 flex justify-center items-center">
          <Link
            to="/dashboard"
            className={clsx(
              "text-sm font-semibold leading-7 relative",
              theme.text1,
            )}
          >
            <ArrowSmallLeftIcon
              className={clsx(
                "w-4 h-4",
                "absolute -left-5 top-1/2 transform -translate-y-1/2",
                theme.text1,
              )}
            />
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
};
