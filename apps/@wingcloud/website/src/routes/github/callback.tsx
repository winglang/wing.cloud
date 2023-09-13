import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { trpc } from "../../utils/trpc.js";

export const Component = () => {
  const callback = trpc["github/callback"].useMutation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    callback.mutate(
      {
        code: searchParams.get("code") ?? "",
      },
      {
        onSuccess: () => {
          navigate("/dashboard/team");
        },
      },
    );
  }, []);
  return <></>;
};
