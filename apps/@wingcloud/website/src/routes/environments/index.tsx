import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { wrpc } from "../../utils/wrpc.js";

import { RuntimeLogs } from "./components/build-logs.js";
import { DeploymentLogs } from "./components/deployment-logs.js";
import { EnvironmentDetails } from "./components/environment-details.js";
import { TestsLogs } from "./components/tests-logs.js";

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

  return (
    <div>
      <div className="space-y-4">
        <EnvironmentDetails
          loading={environment.isLoading}
          environment={environment.data?.environment}
        />

        <TestsLogs
          testResults={
            environment.data?.environment.testResults?.testResults || []
          }
          logs={logs.data?.tests || []}
          loading={logs.isLoading}
        />

        <DeploymentLogs
          logs={logs.data?.deploy || []}
          loading={logs.isLoading}
        />

        <RuntimeLogs logs={logs.data?.build || []} loading={logs.isLoading} />
      </div>
    </div>
  );
};
