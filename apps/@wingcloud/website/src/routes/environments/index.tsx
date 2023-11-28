import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import { Header } from "../../components/header.js";
import { wrpc } from "../../utils/wrpc.js";

export const RUNTIME_LOGS_ID = "runtime-logs";
export const TEST_LOGS_ID = "test-logs";
export const DEPLOYMENT_LOGS_ID = "deployment-logs";

import { DeploymentLogs } from "./components/deployment-logs.js";
import { EnvironmentDetails } from "./components/environment-details.js";
import { RuntimeLogs } from "./components/runtime-logs.js";
import { TestsLogs } from "./components/tests-logs.js";

import clsx from "clsx";

export const Component = () => {
  const { owner, appName, branch } = useParams();

  const [testLogsOpen, setTestLogsOpen] = useState(false);
  const [runtimeLogsOpen, setRuntimeLogsOpen] = useState(false);
  const [deploymentLogsOpen, setDeploymentLogsOpen] = useState(false);

  const environment = wrpc["app.environment"].useQuery(
    {
      owner: owner!,
      appName: appName!,
      branch: branch!,
    },
    {
      // TODO: query invalidation
      refetchInterval: 1000 * 10,
    },
  );

  const logs = wrpc["app.environment.logs"].useQuery(
    {
      owner: owner!,
      appName: appName!,
      branch: branch!,
    },
    {
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
    <div className="flex flex-col">
      <Header />
      <div
        className={clsx(
          "w-full flex-grow overflow-auto",
          "max-w-5xl mx-auto py-4 px-4 sm:px-6 sm:py-6",
          "space-y-4",
        )}
      >
        <EnvironmentDetails
          loading={environment.isLoading}
          environment={environment.data?.environment}
        />

        <TestsLogs
          id={TEST_LOGS_ID}
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
          id={DEPLOYMENT_LOGS_ID}
          isOpen={deploymentLogsOpen}
          setIsOpen={setDeploymentLogsOpen}
          logs={logs.data?.deploy || []}
          loading={logs.isLoading}
        />

        <RuntimeLogs
          id={RUNTIME_LOGS_ID}
          isOpen={runtimeLogsOpen}
          setIsOpen={setRuntimeLogsOpen}
          logs={logs.data?.runtime || []}
          loading={logs.isLoading}
        />
      </div>
    </div>
  );
};
