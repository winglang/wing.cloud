/* eslint-disable unicorn/no-await-expression-member */
import { createBrowserRouter } from "react-router-dom";

import { NoMatch } from "./components/no-match.js";

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("./routes/index.jsx"),
    children: [
      {
        path: "team",
        lazy: () => import("./routes/team.jsx"),
      },
    ],
  },
  {
    path: "*",
    element: <NoMatch />,
  },
]);
