import { ErrorBoundary } from "../../../../components/error-boundary.js";
import { Header } from "../../../../components/header.js";

import { SettingsPage } from "./settings-page.js";

export const Component = () => {
  return (
    <div className="flex flex-col">
      <Header />
      <ErrorBoundary>
        <SettingsPage />
      </ErrorBoundary>
    </div>
  );
};
