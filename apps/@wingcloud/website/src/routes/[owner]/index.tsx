import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary.js";
import { Header } from "../../components/header.js";

import { OwnerPage } from "./_components/owner-page.js";
import clsx from "clsx";
import { useTheme } from "../../design-system/theme-provider.js";

export const Component = () => {
  const { owner } = useParams();
  const { theme } = useTheme();

  useEffect(() => {
    console.log("Component", { owner });
  }, [owner]);

  return (
    <div className="flex flex-col h-full">
      <Header
        tabs={[
          {
            name: "Overview",
            to: `/${owner}`,
          },
        ]}
      />
      <ErrorBoundary>
        <div className="overflow-auto">
          <div
            className={clsx(
              "py-4 sm:py-8",
              "relative transition-all",
              theme.pageMaxWidth,
              theme.pagePadding,
            )}
          >
            <OwnerPage ownerParam={owner!} />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};
