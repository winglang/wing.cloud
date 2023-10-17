/* eslint-disable unicorn/no-await-expression-member */
import { createBrowserRouter } from "react-router-dom";

import { NoMatch } from "./components/no-match.js";
import {
  Component,
  type ProjectProps,
} from "./routes/dashboard/projects/project-id.js";

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
        path: "team",
        lazy: () => import("./routes/dashboard/team.js"),
      },
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
