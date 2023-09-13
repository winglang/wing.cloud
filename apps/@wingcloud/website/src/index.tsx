import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app.js";

createRoot(document.querySelector("#app")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
