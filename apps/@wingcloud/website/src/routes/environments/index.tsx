import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";

import { wrpc } from "../../utils/wrpc.js";

import { RUNTIME_LOGS_ID, RuntimeLogs } from "./components/build-logs.js";
import {
  DEPLOYMENT_LOGS_ID,
  DeploymentLogs,
} from "./components/deployment-logs.js";
import { EnvironmentDetails } from "./components/environment-details.js";
import { TEST_LOGS_ID, TestsLogs } from "./components/tests-logs.js";

export const Component = () => {
  const { appName, branch } = useParams();

  const environment = wrpc["app.environment"].useQuery(
    {
      appName: appName!,
      branch: branch!,
    },
    {
      enabled: appName !== undefined && branch !== undefined,
      // TODO: query invalidation
      refetchInterval: 1000 * 10,
    },
  );

  const logs = wrpc["app.environment.logs"].useQuery(
    {
      appName: appName!,
      branch: branch!,
    },
    {
      enabled: appName !== undefined && branch !== undefined,
      // TODO: query invalidation
      refetchInterval: 1000 * 10,
    },
  );

  const location = useLocation();

  const locationHash = useMemo(() => {
    if (location.hash) {
      return location.hash.slice(1);
    }
  }, [location.search]);

  const openDeploymentLogs = useMemo(() => {
    return (
      locationHash === DEPLOYMENT_LOGS_ID ||
      environment.data?.environment.status === "error"
    );
  }, [locationHash, environment.data?.environment.status]);

  return (
    <div>
      <div className="space-y-4">
        <EnvironmentDetails
          loading={environment.isLoading}
          environment={environment.data?.environment}
        />

        <TestsLogs
          defaultOpen={locationHash === TEST_LOGS_ID}
          testResults={
            environment.data?.environment.testResults?.testResults || []
          }
          logs={logs.data?.tests || []}
          loading={logs.isLoading}
        />

        <DeploymentLogs
          defaultOpen={openDeploymentLogs}
          logs={logs.data?.deploy || []}
          loading={logs.isLoading}
        />

        <RuntimeLogs
          defaultOpen={locationHash === RUNTIME_LOGS_ID}
          logs={logs.data?.runtime || []}
          loading={logs.isLoading}
        />
      </div>
    </div>
  );
};
