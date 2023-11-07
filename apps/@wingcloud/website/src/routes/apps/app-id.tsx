import { Link, useParams } from "react-router-dom";

import { wrpc } from "../../utils/wrpc.js";

export interface AppProps {
  appId: string;
}

export const Component = () => {
  const { appId } = useParams();

  // TODO: Feels cleaner to separate in different components so we don't have to use the `enabled` option.
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
