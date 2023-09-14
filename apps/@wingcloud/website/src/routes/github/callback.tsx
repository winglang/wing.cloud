import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { trpc } from "../../utils/trpc.js";

export const Component = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const initialized = useRef(false);

  const callback = trpc["github/callback"].useMutation({
    onSuccess: () => {
      navigate("/dashboard/team");
    },
    onError: (error) => {
      console.error(error);
      setError(error.message);
    },
  });
  useEffect(() => {
    const code = searchParams.get("code") || "";
    if (!code) {
      setError("No code provided");
    }

    if (!initialized.current) {
      initialized.current = true;
      callback.mutate({
        code,
      });
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
      {!error && <div className="text-xs">Loading...</div>}
    </div>
  );
};
