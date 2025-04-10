import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { SpinnerLoader } from "../../../components/spinner-loader.js";
import { Banner } from "../../../design-system/banner.js";
import { WingIcon } from "../../../icons/wing-icon.js";
import { EARLY_ACCESS_CODE_QUERY_PARAM } from "../../../utils/wrpc.js";

export const LoginPage = () => {
  const [searchParams] = useSearchParams();

  // TODO: Use state to prevent man-in-the-middle attacks.
  const { GITHUB_APP_CLIENT_ID, WINGCLOUD_ORIGIN, REQUIRE_EARLY_ACCESS_CODE } =
    wing.env;

  const [loading, setLoading] = useState(false);

  const EARLY_ACCESS_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSer0ZVQkROHnBsQYjBVGVGSMNcECjGKC0MTE4PbErEp0mocvw/viewform";

  const AUTHORIZE_URL = (() => {
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.append("client_id", GITHUB_APP_CLIENT_ID);

    const redirectUrl = new URL(WINGCLOUD_ORIGIN);
    redirectUrl.pathname = "/wrpc/github.callback";

    const params = new URLSearchParams(location.search);
    const eacode = params.get(EARLY_ACCESS_CODE_QUERY_PARAM);
    if (eacode) {
      redirectUrl.searchParams.append(EARLY_ACCESS_CODE_QUERY_PARAM, eacode);
    }
    url.searchParams.append("redirect_uri", redirectUrl.toString());
    return url.toString();
  })();

  const [error, setError] = useState("");
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  useEffect(() => {
    const errorBase64 = searchParams.get("error") ?? "";
    if (!errorBase64) {
      return;
    }
    try {
      const errorString = atob(errorBase64);
      const error = JSON.parse(errorString);
      console.log("error", error);

      searchParams.delete("error");
      setError(error.message);
      setShowErrorBanner(true);
    } catch (error) {
      console.log("error", error);
    }
  }, []);

  return (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
      {REQUIRE_EARLY_ACCESS_CODE === "true" && (
        <Banner>
          An early access code is required to sign in for the first time.
        </Banner>
      )}
      <Banner
        type="error"
        visible={showErrorBanner}
        onClose={() => setShowErrorBanner(false)}
      >
        {error}
        &nbsp;&nbsp;&nbsp;
        <Link
          to={EARLY_ACCESS_URL}
          className={clsx("text-center", "text-blue-800 hover:underline")}
          onClick={(event) => {
            event.preventDefault();
            // Needed to navigate to the landing page.
            location.href = EARLY_ACCESS_URL;
          }}
        >
          Apply here!
        </Link>
      </Banner>

      <div className="flex flex-col grow max-w-md gap-4">
        <div
          className={clsx(
            "bg-white pt-10 pb-6 px-6 rounded-xl shadow-lg w-full text-center",
            "flex flex-col justify-center",
            "space-y-6",
          )}
        >
          <WingIcon className="size-20 text-gray-800 self-center" />
          <div className="space-y-8">
            <p className="text-gray-600">
              Sign in to your{" "}
              <b className="font-bold text-gray-800">Wing Cloud</b> account
            </p>

            <div className="flex flex-col space-y-2">
              <Link
                to={AUTHORIZE_URL}
                className={clsx(
                  "text-white py-2 rounded-md",
                  "flex items-center justify-center gap-x-4",
                  "bg-gray-800 transition-all",
                  !loading && "hover:bg-gray-900 hover:shadow-md",
                  loading && "opacity-90 cursor-not-allowed",
                )}
                onClick={(event) => {
                  setLoading(true);
                }}
              >
                <div className="relative">
                  Sign in with GitHub{" "}
                  {loading && (
                    <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
                      <SpinnerLoader size="sm" />
                    </div>
                  )}
                </div>
              </Link>
              <div className="text-sm text-gray-500">or</div>
              <div className="flex grow justify-center text-sm">
                <Link
                  to={EARLY_ACCESS_URL}
                  className={clsx(
                    "text-center",
                    "text-gray-800 hover:underline",
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    // Needed to navigate to the landing page.
                    location.href = EARLY_ACCESS_URL;
                  }}
                >
                  ← Apply for an Early Access
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
