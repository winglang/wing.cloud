import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { SpinnerLoader } from "../../components/spinner-loader.js";
import { wrpc } from "../../utils/wrpc.js";

export const Component = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const initialized = useRef(false);

  const code = searchParams.get("code")!;
  wrpc["github.callback"].useQuery(
    {
      code,
    },
    {
      onSuccess: () => {
        navigate("/dashboard/projects");
      },
      onError: (error) => {
        console.error(error);
        if (error instanceof Error) {
          setError(error.message);
        }
      },
    },
  );

  useEffect(() => {
    const code = searchParams.get("code") || "";
    if (!code) {
      setError("No code provided");
    }

    if (!initialized.current) {
      initialized.current = true;
    }
  }, []);

  return (
    <div className="p-6">
      {error && (
        <div>
          <div>{error}</div>
          <Link to="/">Go to the home page</Link>
        </div>
      )}
      {!error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader data-testid="main-view-loader" />
        </div>
      )}
    </div>
  );
};
