import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import { wrpc } from "../../../../utils/wrpc.js";
export const TEST_LOGS_ID = "test-logs";

import { TestsLogs } from "./_components/tests-logs.js";

const TestsPage = ({
  owner,
  appName,
  branch,
}: {
  owner: string;
  appName: string;
  branch: string;
}) => {
  const [testLogsOpen, setTestLogsOpen] = useState(true);

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
      default: {
        if (selectedTestId) {
          setTestLogsOpen(true);
        }
      }
    }
  }, [locationHash, logs.data?.tests, selectedTestId]);

  return (
    <TestsLogs
      id={TEST_LOGS_ID}
      isOpen={testLogsOpen}
      setIsOpen={setTestLogsOpen}
      testResults={environment.data?.environment.testResults?.testResults || []}
      selectedTestId={selectedTestId}
      logs={logs.data?.tests || []}
      loading={logs.isLoading}
    />
  );
};

export const Component = () => {
  const { owner, appName, branch } = useParams();
  return <TestsPage owner={owner!} appName={appName!} branch={branch!} />;
};
