import { useParams } from "react-router-dom";

import { wrpc } from "../../../../utils/wrpc.js";
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
    <AppLogs
      id={DEPLOYMENT_LOGS_ID}
      title="Deployment"
      isOpen={true}
      setIsOpen={() => {}}
      logs={logs.data?.deploy || []}
      loading={logs.isLoading}
    />
  );
};

export const Component = () => {
  const { owner, appName, branch } = useParams();
  return <LogsPage owner={owner!} appName={appName!} branch={branch!} />;
};
