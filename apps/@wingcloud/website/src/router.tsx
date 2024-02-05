import { createBrowserRouter } from "react-router-dom";

import { HttpErrorPage } from "./components/http-error-page.js";

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("./routes/index.js"),
    children: [
      {
        path: "/add",
        lazy: () => import("./routes/add/index.js"),
      },
      {
        path: "/dashboard",
        lazy: () => import("./routes/dashboard.js"),
      },
      {
        path: "/:owner",
        lazy: () => import("./routes/[owner]/index.js"),
      },
      {
        path: "/:owner/:appName",
        lazy: () => import("./routes/[owner]/[appName]/index.js"),
      },
      {
        path: "/:owner/:appName/settings",
        lazy: () => import("./routes/[owner]/[appName]/settings/index.js"),
      },
      {
        path: "/:owner/:appName/:branch",
        lazy: () => import("./routes/[owner]/[appName]/[branch]/index.js"),
      },
      {
        path: "/:owner/:appName/:branch/console",
        lazy: () =>
          import("./routes/[owner]/[appName]/[branch]/console/index.js"),
      },
    ],
  },
  {
    path: "*",
    element: (
      <HttpErrorPage
        code={404}
        title="Page not found"
        message="Sorry, we couldn’t find the page you’re looking for."
      />
    ),
  },
]);
