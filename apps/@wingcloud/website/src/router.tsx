import { createBrowserRouter } from "react-router-dom";

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
        path: "/new/connect",
        lazy: () => import("./routes/new/connect.js"),
      },
      {
        path: "/:user",
        lazy: () => import("./routes/user/index.js"),
      },
      {
        path: "/:user/:appName",
        lazy: () => import("./routes/user/app.js"),
      },
      {
        path: "/:user/:appName/settings",
        lazy: () => import("./routes/user/settings.js"),
      },
      {
        path: "/:user/:appName/:branch",
        lazy: () => import("./routes/environments/index.js"),
      },
      {
        path: "/:user/:appName/:branch/console",
        lazy: () => import("./routes/environments/console-preview.js"),
      },
    ],
  },
  {
    path: "*",
    element: <NoMatch />,
  },
]);
