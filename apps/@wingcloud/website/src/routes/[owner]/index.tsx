import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary.js";
import { Header } from "../../components/header.js";

import { OwnerPage } from "./_components/owner-page.js";

export const Component = () => {
  const { owner } = useParams();
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
          <div className="max-w-7xl mx-auto p-4 md:p-8 relative">
            <OwnerPage ownerParam={owner!} />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};
