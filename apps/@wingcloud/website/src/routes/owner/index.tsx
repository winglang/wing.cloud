import { ErrorBoundary } from "../../components/error-boundary.js";
import { Header } from "../../components/header.js";

import { OwnerPage } from "./owner-page.js";

export const Component = () => {
  return (
    <div>
      <Header />
      <ErrorBoundary>
        <OwnerPage />
      </ErrorBoundary>
    </div>
  );
};
