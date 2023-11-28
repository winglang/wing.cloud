import { ErrorBoundary } from "../../../../components/error-boundary.js";
import { Header } from "../../../../components/header.js";

import { EnvironmentPage } from "./environment-page.js";

export const Component = () => {
  return (
    <div>
      <Header />
      <ErrorBoundary>
        <EnvironmentPage />
      </ErrorBoundary>
    </div>
  );
};
