import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { trpc } from "../../utils/trpc.js";

export const Component = () => {
  const callback = trpc["github/callback"].useMutation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [error, setError] = useState("");

  useEffect(() => {
    callback.mutate(
      {
        code: searchParams.get("code") ?? "",
      },
      {
        onSuccess: () => {
          navigate("/dashboard/team");
        },
        onError: (error) => {
          console.error(error);
          setError("Something went wrong.");
        },
      },
    );
  }, []);
  return (
    error && (
      <div className="p-6">
        <div className="text-md">{error}</div>
        <Link to="/">Go to the home page</Link>
      </div>
    )
  );
};
