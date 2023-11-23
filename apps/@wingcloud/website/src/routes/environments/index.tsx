import { useEffect, useMemo, useState } from "react";
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

  const [testLogsOpen, setTestLogsOpen] = useState(false);
  const [runtimeLogsOpen, setRuntimeLogsOpen] = useState(false);
  const [deploymentLogsOpen, setDeploymentLogsOpen] = useState(false);

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
  const locationHash = useMemo(() => location.hash.slice(1), [location.hash]);

  const selectedTestId = useMemo(() => {
    if (!logs.data?.tests) {
      return;
    }
    const testId = decodeURIComponent(locationHash);
    return logs.data?.tests.find((test) => test.id === testId)?.id;
  }, [logs.data?.tests, locationHash]);

  useEffect(() => {
    switch (locationHash) {
      case TEST_LOGS_ID: {
        setTestLogsOpen(true);

        break;
      }
      case DEPLOYMENT_LOGS_ID: {
        setDeploymentLogsOpen(true);

        break;
      }
      case RUNTIME_LOGS_ID: {
        setRuntimeLogsOpen(true);

        break;
      }
      default: {
        if (selectedTestId) {
          setTestLogsOpen(true);
        }
      }
    }
  }, [locationHash, logs.data?.tests]);

  useEffect(() => {
    if (environment.data?.environment?.status === "error") {
      setRuntimeLogsOpen(true);
    }
  }, [environment.data?.environment?.status]);

  return (
    <div>
      <div className="space-y-4">
        <EnvironmentDetails
          loading={environment.isLoading}
          environment={environment.data?.environment}
        />

        <TestsLogs
          isOpen={testLogsOpen}
          setIsOpen={setTestLogsOpen}
          testResults={
            environment.data?.environment.testResults?.testResults || []
          }
          selectedTestId={selectedTestId}
          logs={logs.data?.tests || []}
          loading={logs.isLoading}
        />

        <DeploymentLogs
          isOpen={deploymentLogsOpen}
          setIsOpen={setDeploymentLogsOpen}
          logs={logs.data?.deploy || []}
          loading={logs.isLoading}
        />

        <RuntimeLogs
          isOpen={runtimeLogsOpen}
          setIsOpen={setRuntimeLogsOpen}
          logs={logs.data?.runtime || []}
          loading={logs.isLoading}
        />
      </div>
    </div>
  );
};
