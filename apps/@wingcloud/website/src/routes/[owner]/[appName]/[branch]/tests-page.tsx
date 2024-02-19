import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import { wrpc } from "../../../../utils/wrpc.js";
export const TEST_LOGS_ID = "test-logs";

import { SectionTitle } from "../../../../components/section-title.js";
import { TestsLogs } from "./_components/tests-logs.js";
import clsx from "clsx";
import { PageHeader } from "../../../../components/page-header.js";
import { useTheme } from "../../../../design-system/theme-provider.js";

const TestsPage = ({
  owner,
  appName,
  branch,
}: {
  owner: string;
  appName: string;
  branch: string;
}) => {
  const { theme } = useTheme();

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

  return (
    <>
      <PageHeader title="Tests" noBackground />
      <div
        className={clsx(
          "relative transition-all pb-4",
          theme.pageMaxWidth,
          theme.pagePadding,
          "space-y-2",
        )}
      >
        <SectionTitle>Tests Logs</SectionTitle>
        <TestsLogs
          id={TEST_LOGS_ID}
          testResults={
            environment.data?.environment.testResults?.testResults || []
          }
          selectedTestId={selectedTestId}
          logs={logs.data?.tests || []}
          loading={logs.isLoading}
        />
      </div>
    </>
  );
};

export const Component = () => {
  const { owner, appName, branch } = useParams();
  return <TestsPage owner={owner!} appName={appName!} branch={branch!} />;
};
