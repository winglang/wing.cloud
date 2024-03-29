import clsx from "clsx";
import { useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary.js";
import { Header } from "../../components/header.js";
import { useTheme } from "../../design-system/theme-provider.js";

export const Component = () => {
  const { theme } = useTheme();

  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.pathname === "/admin") {
      navigate("/admin/users");
    }
  }, [navigate]);

  return (
    <div className="flex flex-col h-full">
      <ErrorBoundary>
        <Header
          breadcrumbs={[{ label: "Admin", to: "/admin/users" }]}
          tabs={[
            {
              name: "Users",
              to: "/admin/users",
            },
            {
              name: "Early Access",
              to: "/admin/early-access",
            },
          ]}
        />
        <div className="overflow-auto">
          <div
            className={clsx(
              "py-4 sm:py-6",
              "relative transition-all",
              theme.pageMaxWidth,
              theme.pagePadding,
            )}
          >
            <Outlet />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};
