import { useContext, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { SectionTitle } from "../../../../components/section-title.js";
import { wrpc } from "../../../../utils/wrpc.js";

import { Endpoints } from "./_components/endpoints.js";
import { EnvironmentDetails } from "./_components/environment-details.js";
import { Button } from "../../../../design-system/button.js";
import { CurrentAppDataProviderContext } from "../../../../data-store/current-app-data-provider.js";

const Overview = ({
  owner,
  appName,
  branch,
}: {
  owner: string;
  appName: string;
  branch: string;
}) => {
  const { app, setOwner, setAppName } = useContext(
    CurrentAppDataProviderContext,
  );
  useEffect(() => {
    setOwner(owner);
  }, [owner]);
  useEffect(() => {
    setAppName(appName);
  }, [appName]);

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
  const endpoints = useMemo(() => {
    if (!endpointsQuery.data) {
      return [];
    }
    return endpointsQuery.data?.endpoints.sort((a, b) => {
      return a.label.localeCompare(b.label);
    });
  }, [endpointsQuery.data]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <SectionTitle>Overview</SectionTitle>
        <EnvironmentDetails
          owner={owner}
          app={app}
          loading={environmentQuery.isLoading}
          environment={environment}
          actions={
            <Link
              to={`/${owner}/${appName}/${environment?.branch}/console`}
              className="z-10"
            >
              <Button disabled={environment?.status !== "running"}>
                Console
              </Button>
            </Link>
          }
        />
      </div>
      <div className="space-y-2">
        <SectionTitle>Endpoints</SectionTitle>
        <Endpoints
          endpoints={endpoints}
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
