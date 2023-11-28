import { ErrorBoundary } from "../../../../../components/error-boundary.js";
import { Header } from "../../../../../components/header.js";

import { ConsolePage } from "./console-page.js";

export const Component = () => {
  return (
    <div className="flex flex-col">
      <Header />
      <ErrorBoundary>
        <ConsolePage />
      </ErrorBoundary>
    </div>
  );
};
