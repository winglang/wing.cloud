import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app.js";
import { AnalyticsProvider } from "./utils/analytics-provider.js";
import { EventBusProvider } from "./utils/eventbus-provider.js";

createRoot(document.querySelector("#app")!).render(
  <StrictMode>
    <EventBusProvider>
      <AnalyticsProvider>
        <App />
      </AnalyticsProvider>
    </EventBusProvider>
  </StrictMode>,
);
