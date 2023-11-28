import { ErrorBoundary } from "../../../components/error-boundary.js";
import { Header } from "../../../components/header.js";

import { AppPage } from "./app-page.js";

export const Component = () => {
  return (
    <div>
      <Header />
      <ErrorBoundary>
        <AppPage />
      </ErrorBoundary>
    </div>
  );
};
