import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { SpinnerLoader } from "../../components/spinner-loader.js";
import { wrpc } from "../../utils/wrpc.js";

export const Component = () => {
  const { appId, environmentId } = useParams();
  if (!appId || !environmentId) {
    return;
  }
  const environments = wrpc["app.environment"].useQuery({
    environmentId: environmentId,
  });

  const loading = useMemo(() => {
    return environments.isLoading;
  }, [environments.isLoading]);

  return (
    <>
      {loading && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}

      {!loading && <pre>{JSON.stringify(environments.data, undefined, 2)}</pre>}
    </>
  );
};
