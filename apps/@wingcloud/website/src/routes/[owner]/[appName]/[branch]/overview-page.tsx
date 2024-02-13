import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { SectionTitle } from "../../../../components/section-title.js";
import { wrpc } from "../../../../utils/wrpc.js";

import { Endpoints } from "./_components/endpoints.js";
import { EnvironmentDetails } from "./_components/environment-details.js";

const Overview = ({
  owner,
  appName,
  branch,
}: {
  owner: string;
  appName: string;
  branch: string;
}) => {
  const environmentQuery = wrpc["app.environment"].useQuery({
    owner: owner!,
    appName: appName!,
    branch: branch!,
  });
  const environment = useMemo(() => {
    return environmentQuery.data?.environment;
  }, [environmentQuery.data]);

  const endpointsQuery = wrpc["app.environment.endpoints"].useQuery(
    {
      appName: appName!,
      branch: environment?.branch!,
    },
    {
      enabled: !!appName && environment?.status === "running",
    },
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <SectionTitle>Overview</SectionTitle>
        <EnvironmentDetails
          owner={owner}
          appName={appName}
          loading={environmentQuery.isLoading}
          environment={environment}
        />
      </div>
      <div className="space-y-2">
        <SectionTitle>Endpoints</SectionTitle>
        <Endpoints
          endpoints={endpointsQuery.data?.endpoints || []}
          loading={endpointsQuery.isLoading}
          environment={environment}
        />
      </div>
    </div>
  );
};

export const Component = () => {
  const { owner, appName, branch } = useParams();
  return <Overview owner={owner!} appName={appName!} branch={branch!} />;
};
