import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../../components/error-boundary.js";
import { Header } from "../../../../components/header.js";
import { BranchIcon } from "../../../../icons/branch-icon.js";
import { wrpc } from "../../../../utils/wrpc.js";
export const TEST_LOGS_ID = "test-logs";
export const DEPLOYMENT_LOGS_ID = "deployment-logs";
export const RUNTIME_LOGS_ID = "runtime-logs";
export const ENDPOINTS_ID = "endpoints";

import { AppLogs } from "./_components/app-logs.js";
import { Endpoints } from "./_components/endpoints.js";
import { EnvironmentDetails } from "./_components/environment-details.js";
import { TestsLogs } from "./_components/tests-logs.js";

const EnvironmentPage = () => {
  const { owner, appName, branch } = useParams();

  const [testLogsOpen, setTestLogsOpen] = useState(false);
  const [deploymentLogsOpen, setDeploymentLogsOpen] = useState(false);
  const [runtimeLogsOpen, setRuntimeLogsOpen] = useState(false);

  const environment = wrpc["app.environment"].useQuery({
    owner: owner!,
    appName: appName!,
    branch: branch!,
  });

  const logs = wrpc["app.environment.logs"].useQuery(
    {
      owner: owner!,
      appName: appName!,
      branch: branch!,
    },
    {
      // TODO: use query invalidation once logs are not stored in a file
      refetchInterval: 3 * 1000,
    },
  );

  const endpoints = wrpc["app.environment.endpoints"].useQuery({
    appName: appName!,
    branch: branch!,
  });

  const location = useLocation();
  const locationHash = useMemo(() => location.hash.slice(1), [location.hash]);

  const selectedTestId = useMemo(() => {
    if (!logs.data?.tests) {
      return;
    }
    const params = new URLSearchParams(location.search);
    const testId = params.get("testId");
    if (!testId) {
      return;
    }

    return logs.data?.tests.find((test) => test.id === testId)?.id;
  }, [logs.data?.tests, location.search]);

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
  }, [locationHash, logs.data?.tests, selectedTestId]);

  return (
    <div
      className={clsx(
        "w-full flex-grow overflow-auto",
        "max-w-5xl mx-auto p-4 sm:p-6",
        "space-y-4",
      )}
    >
      <EnvironmentDetails
        loading={environment.isLoading}
        environment={environment.data?.environment}
      />
      <Endpoints
        id={ENDPOINTS_ID}
        isOpen={true}
        endpoints={endpoints.data?.endpoints || []}
        loading={endpoints.isLoading}
        environmentType={environment.data?.environment.type}
      />
      <AppLogs
        id={DEPLOYMENT_LOGS_ID}
        title="Deployment Logs"
        isOpen={deploymentLogsOpen}
        setIsOpen={setDeploymentLogsOpen}
        logs={logs.data?.deploy || []}
        loading={logs.isLoading}
      />
      <AppLogs
        id={RUNTIME_LOGS_ID}
        title="Runtime Logs"
        isOpen={runtimeLogsOpen}
        setIsOpen={setRuntimeLogsOpen}
        logs={logs.data?.runtime || []}
        loading={logs.isLoading}
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
    </div>
  );
};

export const Component = () => {
  const { owner, appName, branch } = useParams();
  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[
          { label: appName!, to: `/${owner}/${appName}` },
          {
            label: branch!,
            to: `/${owner}/${appName}/${branch}`,
            icon: <BranchIcon className="w-4 h-4 text-slate-700" />,
          },
        ]}
      />
      <ErrorBoundary>
        <EnvironmentPage />
      </ErrorBoundary>
    </div>
  );
};
