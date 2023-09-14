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
      setError("Something went wrong.");
    },
  });
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      console.log(searchParams.get("code"));
      callback.mutate({
        code: searchParams.get("code") ?? "",
      });
    }
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
