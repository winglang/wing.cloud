import { Link, useParams } from "react-router-dom";

import { wrpc } from "../../utils/wrpc.js";

export interface AppProps {
  appId: string;
}

export const Component = () => {
  const { appId } = useParams();

  // TODO: useQuery should be able to use enabled: false as option
  const app = wrpc["app.get"].useQuery(
    { id: appId! },
    {
      enabled: appId != "",
    },
  );

  return (
    <div>
      <h2>{appId}</h2>

      <pre>
        <code>{JSON.stringify(app.data, undefined, 2)}</code>
      </pre>

      <Link to="/apps">Back to Apps</Link>
    </div>
  );
};
