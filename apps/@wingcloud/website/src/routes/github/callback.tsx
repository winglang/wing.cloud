import { useEffect } from "react";

import { trpc } from "../../utils/trpc.js";

export const Component = () => {
  const callback = trpc["github/callback"].useMutation();
  useEffect(() => {
    const response = callback.mutate(
      {
        code: new URLSearchParams(window.location.search).get("code") || "",
      },
      {
        onSuccess: () => {
          console.log("response", response);
          window.location.href = "/dashboard/team";
        },
      },
    );
  }, []);
  return <></>;
};
