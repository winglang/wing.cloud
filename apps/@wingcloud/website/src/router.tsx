/* eslint-disable unicorn/no-await-expression-member */
import { createBrowserRouter } from "react-router-dom";

import { NoMatch } from "./components/no-match.js";

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("./routes/index.js"),
  },
  {
    path: "/dashboard",
    lazy: () => import("./routes/dashboard/index.jsx"),
    children: [
      {
        path: "projects",
        lazy: () => import("./routes/dashboard/projects.js"),
      },
      {
        path: "projects/:projectId",
        lazy: () => import("./routes/dashboard/projects/project-id.js"),
      },
      {
        path: "new",
        lazy: () => import("./routes/dashboard/new.js"),
      },
    ],
  },
  {
    path: "*",
    element: <NoMatch />,
  },
]);
