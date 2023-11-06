import { useParams } from "react-router-dom";

import { Header } from "../../components/header.js";
import { wrpc } from "../../utils/wrpc.js";

export interface AppProps {
  appId: string;
}

export const Component = () => {
  const { appId } = useParams();
  if (!appId) return;

  const app = wrpc["app.get"].useQuery({ id: appId });

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Apps", to: "/apps" },
          {
            label: app.data?.app.name || "",
            to: `/apps/${appId}`,
          },
        ]}
      />

      <div className="p-6 space-y-4 w-full max-w-5xl mx-auto">
        <pre>
          <code>{JSON.stringify(app.data, undefined, 2)}</code>
        </pre>
      </div>
    </>
  );
};
