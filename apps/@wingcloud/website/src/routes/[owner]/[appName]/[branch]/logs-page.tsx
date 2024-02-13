import { useParams } from "react-router-dom";

import { SectionTitle } from "../../../../components/section-title.js";
import { wrpc } from "../../../../utils/wrpc.js";

export const RUNTIME_LOGS_ID = "runtime-logs";
export const DEPLOYMENT_LOGS_ID = "deployment-logs";

import { AppLogs } from "./_components/app-logs.js";

const LogsPage = ({
  owner,
  appName,
  branch,
}: {
  owner: string;
  appName: string;
  branch: string;
}) => {
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <SectionTitle>Deployment</SectionTitle>
        <AppLogs
          id={DEPLOYMENT_LOGS_ID}
          label="Deployment"
          logs={logs.data?.deploy || []}
          loading={logs.isLoading}
        />
      </div>
      <div className="space-y-2">
        <SectionTitle>Runtime</SectionTitle>
        <AppLogs
          id={RUNTIME_LOGS_ID}
          label="Runtime"
          logs={logs.data?.runtime || []}
          loading={logs.isLoading}
        />
      </div>
    </div>
  );
};

export const Component = () => {
  const { owner, appName, branch } = useParams();
  return <LogsPage owner={owner!} appName={appName!} branch={branch!} />;
};
