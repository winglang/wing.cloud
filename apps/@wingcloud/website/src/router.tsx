/* eslint-disable unicorn/no-await-expression-member */
import { createBrowserRouter } from "react-router-dom";

import { NoMatch } from "./components/no-match.js";

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("./routes/index.js"),
  },
  {
    path: "projects",
    lazy: () => import("./routes/projects.js"),
  },

  {
    path: "projects/:projectId",
    lazy: () => import("./routes/projects/project-id.js"),
  },
  {
    path: "new",
    lazy: () => import("./routes/new.js"),
  },

  {
    path: "*",
    element: <NoMatch />,
  },
]);
