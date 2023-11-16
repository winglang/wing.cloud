/* eslint-disable unicorn/no-await-expression-member */
import { createBrowserRouter } from "react-router-dom";

import { NoMatch } from "./components/no-match.js";

export const router = createBrowserRouter([
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
        path: ":appName/:environmentId",
        lazy: () => import("./routes/environments/environment.js"),
      },
    ],
  },
  {
    path: "*",
    element: <NoMatch />,
  },
]);
