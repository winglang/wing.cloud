import { useParams } from "react-router-dom";

import { wrpc } from "../../../../utils/wrpc.js";

import { AppLogs } from "./_components/app-logs.js";
import { EnvironmentDetails } from "./_components/environment-details.js";

export const RUNTIME_LOGS_ID = "runtime-logs";

const OVerview = ({
  owner,
  appName,
  branch,
}: {
  owner: string;
  appName: string;
  branch: string;
}) => {
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

  return (
    <>
      <EnvironmentDetails
        owner={owner}
        appName={appName}
        loading={environment.isLoading}
        environment={environment.data?.environment}
      />
      <AppLogs
        id={RUNTIME_LOGS_ID}
        title="Runtime"
        isOpen={true}
        setIsOpen={() => {}}
        logs={logs.data?.runtime || []}
        loading={logs.isLoading}
      />
    </>
  );
};

export const Component = () => {
  const { owner, appName, branch } = useParams();
  return <OVerview owner={owner!} appName={appName!} branch={branch!} />;
};
