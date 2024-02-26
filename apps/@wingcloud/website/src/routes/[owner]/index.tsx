import clsx from "clsx";
import { useParams } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary.js";
import { Header } from "../../components/header.js";
import { useTheme } from "../../design-system/theme-provider.js";

import { OwnerPage } from "./_components/owner-page.js";

export const Component = () => {
  const { owner } = useParams();
  const { theme } = useTheme();

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
              "py-4 sm:py-6",
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
