import { useMemo } from "react";

import type { EnvironmentStatus } from "./wrpc.js";

export const useStatus = (status?: EnvironmentStatus) => {
  const color = useMemo(() => {
    switch (status) {
      case "initializing":
      case "running-server":
      case "running-tests":
      case "deploying": {
        return "yellow";
      }
      case "running": {
        return "green";
      }
      case "error":
      case "tests-error": {
        return "red";
      }
      case "stopped": {
        return "gray";
      }
    }
  }, [status]) as "yellow" | "green" | "red" | "gray";

  const statusString = useMemo(() => {
    if (status === "running-server") {
      return "Starting";
    }
    if (status === "running-tests") {
      return "Running Tests";
    }
    if (status === "tests-error") {
      return "Tests Error";
    }
    if (status === "initializing" || status === "deploying") {
      return "Deploying";
    }
    return status;
  }, [status]);

  return {
    statusString,
    color,
  };
};
