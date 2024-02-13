import { useMemo } from "react";

import type { EnvironmentStatus } from "./wrpc.js";

export const useStatus = (status?: EnvironmentStatus) => {
  const statusString = useMemo(() => {
    if (status === "running-server") {
      return "Starting";
    }
    if (status === "running-tests") {
      return "Running Tests";
    }
    if (status === "initializing" || status === "deploying") {
      return "Deploying";
    }
    return status;
  }, [status]);

  return statusString;
};
