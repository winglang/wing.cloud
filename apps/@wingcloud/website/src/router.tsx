import { createBrowserRouter, redirect } from "react-router-dom";

import { NoMatch } from "./components/no-match.js";

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("./routes/index.js"),
    children: [
      {
        path: "/new",
        lazy: () => import("./routes/new/index.js"),
      },
      {
        path: "/dashboard",
        lazy: () => import("./routes/dashboard.js"),
      },
      {
        path: "/new/connect",
        lazy: () => import("./routes/new/connect.js"),
      },
      {
        path: "/:owner",
        lazy: () => import("./routes/owner/index.js"),
      },
      {
        path: "/:owner/:appName",
        lazy: () => import("./routes/owner/app.js"),
      },
      {
        path: "/:owner/:appName/settings",
        lazy: () => import("./routes/app-settings/index.js"),
      },
      {
        path: "/:owner/:appName/:branch",
        lazy: () => import("./routes/environments/index.js"),
      },
      {
        path: "/:owner/:appName/:branch/console",
        lazy: () => import("./routes/environments/console-preview.js"),
      },
    ],
  },
  {
    path: "*",
    element: <NoMatch />,
  },
]);
