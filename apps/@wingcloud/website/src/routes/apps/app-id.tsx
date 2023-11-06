import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Header } from "../../components/header.js";
import { SpinnerLoader } from "../../components/spinner-loader.js";
import { wrpc } from "../../utils/wrpc.js";

export interface AppProps {
  appId: string;
}

export const Component = () => {
  const { appId } = useParams();
  if (!appId) return;

  // TODO: useQuery should be able to use enabled: false as option
  const app = wrpc["app.get"].useQuery(
    { id: appId },
    // {
    //   enabled: false,
    // },
  );

  const repository = wrpc["github.getRepository"].useQuery(
    {
      owner: app.data?.app.repoOwner || "",
      repo: app.data?.app.repoName || "",
    },
    // {
    //   enabled: app.data?.app.repoOwner && app.data?.app.repoName,
    // },
  );

  const environments = wrpc["app.environments"].useQuery({ id: appId });

  const loading = useMemo(() => {
    return app.isLoading || environments.isLoading;
  }, [app.isLoading, environments.isLoading]);

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

      {loading && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}

      {!loading && (
        <div className="p-6 space-y-4 w-full max-w-5xl mx-auto">
          <div className="flex gap-x-4 bg-white rounded p-4 shadow">
            <img
              src={app.data?.app.imageUrl}
              alt=""
              className="w-24 h-24 rounded-full"
            />
            <div className="text-slate-700 text-xl self-end">
              {app.data?.app.name}
            </div>
          </div>

          <pre>{JSON.stringify(environments.data, undefined, 2)}</pre>
        </div>
      )}
    </>
  );
};
