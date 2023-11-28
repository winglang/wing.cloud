import { ErrorBoundary } from "react-error-boundary";
import { Outlet } from "react-router-dom";

import { NoMatch } from "../components/no-match.js";

export const Component = () => {
  return (
    <ErrorBoundary fallbackRender={() => <NoMatch />}>
      <Outlet />
    </ErrorBoundary>
  );
};
