import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { wrpc } from "../../../../utils/wrpc.js";

import { SecretsList } from "./_components/secrets-list.js";

export const Component = () => {
  const { owner, appName } = useParams();

  const appQuery = wrpc["app.getByName"].useQuery(
    { owner: owner!, appName: appName! },
    { refetchOnMount: true },
  );

  const app = useMemo(() => {
    return appQuery.data?.app;
  }, [appQuery.data]);

  return <SecretsList appId={app?.appId || ""} />;
};
