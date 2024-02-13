import clsx from "clsx";
import { useParams } from "react-router-dom";

import { wrpc } from "../../../../utils/wrpc.js";
export const ENDPOINTS_ID = "endpoints";

import { Endpoints } from "./_components/endpoints.js";

const EndpointsPage = ({
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

  const endpoints = wrpc["app.environment.endpoints"].useQuery({
    appName: appName!,
    branch: branch!,
  });

  return (
    <Endpoints
      id={ENDPOINTS_ID}
      isOpen={true}
      endpoints={endpoints.data?.endpoints || []}
      loading={endpoints.isLoading}
      environment={environment.data?.environment}
    />
  );
};

export const Component = () => {
  const { owner, appName, branch } = useParams();
  return <EndpointsPage owner={owner!} appName={appName!} branch={branch!} />;
};
