import { createBrowserRouter } from "react-router-dom";

import { HttpErrorPage } from "./components/http-error-page.js";

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
        lazy: () => import("./routes/owner/app/index.js"),
      },
      {
        path: "/:owner/:appName/settings",
        lazy: () => import("./routes/owner/app/settings/index.js"),
      },
      {
        path: "/:owner/:appName/:branch",
        lazy: () => import("./routes/owner/app/environments/index.js"),
      },
      {
        path: "/:owner/:appName/:branch/console",
        lazy: () => import("./routes/owner/app/environments/console/index.js"),
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
