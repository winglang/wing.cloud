/* eslint-disable unicorn/no-await-expression-member */
import { createBrowserRouter } from "react-router-dom";

import { NoMatch } from "./components/no-match.js";

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("./routes/index.js"),
    children: [
      {
        path: "apps",
        lazy: () => import("./routes/apps.js"),
      },
      {
        path: "apps/:appId",
        lazy: () => import("./routes/apps/app-id.js"),
      },
      {
        path: "apps/:appId/:environmentId",
        lazy: () => import("./routes/environments/environment-id.js"),
      },
      {
        path: "new",
        lazy: () => import("./routes/new.js"),
      },
    ],
  },
  {
    path: "*",
    element: <NoMatch />,
  },
]);
