import { createBrowserRouter, redirect } from "react-router-dom";

import { NoMatch } from "./components/no-match.js";

export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => {
      throw redirect("/apps");
    },
  },
  {
    path: "/apps",
    lazy: () => import("./routes/index.js"),
    children: [
      {
        path: "",
        lazy: () => import("./routes/apps.js"),
      },
      {
        path: "new",
        lazy: () => import("./routes/new/index.js"),
      },
      {
        path: "new/connect",
        lazy: () => import("./routes/new/connect.js"),
      },
      {
        path: ":appName",
        lazy: () => import("./routes/apps/app.js"),
      },
      {
        path: ":appName/:branch",
        lazy: () => import("./routes/environments/index.js"),
      },
      {
        path: ":appName/:branch/console",
        lazy: () => import("./routes/environments/console-preview.js"),
      },
      {
        path: ":appName/settings",
        lazy: () => import("./routes/apps/settings.js"),
      },
    ],
  },
  {
    path: "*",
    element: <NoMatch />,
  },
]);
