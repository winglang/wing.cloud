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

  const formattedMessage = useMemo(() => {
    if (!message.endsWith(".")) {
      return message + ".";
    }
  }, [message]);

  const link = useMemo(() => {
    if (code === 401) {
      return "/";
    }
    return "/dashboard";
  }, [code]);

  return (
    <div className="px-6 py-24 sm:py-32 lg:px-8">
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
            "mt-5 text-base leading-7 text-slate-600",
            theme.text1,
          )}
        >
          {formattedMessage}
        </p>
        <div className="mt-8 flex justify-center items-center">
          <Link
            to={link}
            className={clsx(
              "inline-flex gap-2 items-center text-xs font-medium outline-none rounded-md",
              "p-1.5 sm:px-2.5 sm:py-1.5 border shadow-sm truncate",
              "font-semibold",
              theme.borderInput,
              theme.focusVisible,
              theme.bgInput,
              theme.bgInputHover,
              theme.text1,
            )}
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};
