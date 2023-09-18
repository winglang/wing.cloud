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
        path: "team",
        lazy: () => import("./routes/dashboard/team.js"),
      },
    ],
  },
  {
    path: "/github/callback",
    lazy: () => import("./routes/github/callback.jsx"),
  },
  {
    path: "*",
    element: <NoMatch />,
  },
]);
