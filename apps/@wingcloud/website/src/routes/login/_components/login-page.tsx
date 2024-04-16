import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useTheme } from "../../../design-system/theme-provider.js";
import { WingIcon } from "../../../icons/wing-icon.js";

export const LoginPage = () => {
  // TODO: Use state to prevent man-in-the-middle attacks.
  const { GITHUB_APP_CLIENT_ID } = wing.env;

  const HOME_URL = useMemo(() => {
    const url = new URL(location.href);
    url.pathname = "";
    return url.toString();
  }, [location.href]);

  const AUTHORIZE_URL = (() => {
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.append("client_id", GITHUB_APP_CLIENT_ID);
    if (import.meta.env.DEV) {
      url.searchParams.append(
        "redirect_uri",
        "http://localhost:3900/wrpc/github.callback",
      );
    }
    return url.toString();
  })();

  return (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <div
        className={clsx(
          "bg-white pt-10 pb-6 px-6 rounded-xl shadow-lg w-full max-w-md text-center",
          "flex flex-col justify-center",
          "space-y-6",
        )}
      >
        <WingIcon className="size-20 text-gray-800 self-center" />
        <div className="space-y-4">
          <p className="text-gray-500">
            Sign in to your{" "}
            <b className="font-bold text-slate-600">Wing Cloud</b> account.
          </p>

          <div className="flex flex-col gap-y-4">
            <Link
              to={AUTHORIZE_URL}
              className="block w-full bg-gray-800 text-white text-center py-2 rounded hover:bg-gray-900 transition-colors"
            >
              Sign in with GitHub
            </Link>
            <Link
              to={HOME_URL}
              className={clsx(
                "text-gray-600 hover:text-gray-800 transition-colors",
                "gap-1 text-sm",
              )}
            >
              Go back Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
