import { createBrowserRouter } from "react-router-dom";

import { HttpErrorPage } from "./components/http-error-page.js";
export const router = (onReady: () => void) => {
  const lazyLoading = async (module: Promise<any>) => {
    return module.then((module) => {
      onReady();
      return module;
    });
  };
  return createBrowserRouter([
    {
      path: "/",
      lazy: () => import("./routes/index.js"),
      children: [
        {
          path: "/add",
          lazy: () => lazyLoading(import("./routes/add/index.js")),
        },
        {
          path: "/dashboard",
          lazy: () => lazyLoading(import("./routes/dashboard.js")),
        },
        {
          path: "/:owner",
          lazy: () => lazyLoading(import("./routes/[owner]/index.js")),
        },
        {
          path: "/:owner/:appName",
          lazy: () =>
            lazyLoading(import("./routes/[owner]/[appName]/index.js")),
          children: [
            {
              path: "/:owner/:appName",
              lazy: () =>
                lazyLoading(import("./routes/[owner]/[appName]/overview.js")),
            },
            {
              path: "/:owner/:appName/settings",
              lazy: () =>
                lazyLoading(
                  import("./routes/[owner]/[appName]/settings/index.js"),
                ),
            },
          ],
        },
        {
          path: "/:owner/:appName/settings",
          lazy: () => import("./routes/[owner]/[appName]/settings/index.js"),
        },
        {
          path: "/:owner/:appName",
          lazy: () =>
            lazyLoading(import("./routes/[owner]/[appName]/[branch]/index.js")),
          children: [
            {
              path: "/:owner/:appName/environment/*",
              lazy: () =>
                lazyLoading(
                  import("./routes/[owner]/[appName]/[branch]/overview.js"),
                ),
            },
            {
              path: "/:owner/:appName/logs/*",
              lazy: () =>
                lazyLoading(
                  import("./routes/[owner]/[appName]/[branch]/logs.js"),
                ),
            },
            {
              path: "/:owner/:appName/tests/*",
              lazy: () =>
                lazyLoading(
                  import("./routes/[owner]/[appName]/[branch]/tests-page.js"),
                ),
            },
          ],
        },
        {
          path: "/:owner/:appName/console/*",
          lazy: () =>
            lazyLoading(
              import("./routes/[owner]/[appName]/[branch]/console/index.js"),
            ),
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
};
