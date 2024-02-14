import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { ErrorBoundary } from "../components/error-boundary.js";
import { Header } from "../components/header.js";
import { SpinnerLoader } from "../components/spinner-loader.js";
import { wrpc } from "../utils/wrpc.js";

const DashboardPage = () => {
  const navigate = useNavigate();

  const userQuery = wrpc["auth.check"].useQuery(undefined, {
    throwOnError: false,
    retry: false,
  });
  useEffect(() => {
    if (userQuery.isLoading) {
      return;
    }

    if (!userQuery?.data?.user.username) {
      navigate("/");
      return;
    }
    navigate(`/${userQuery.data.user.username}`);
  }, [userQuery.data, navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <SpinnerLoader />
    </div>
  );
};

export const Component = () => {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <ErrorBoundary>
        <DashboardPage />
      </ErrorBoundary>
    </div>
  );
};
