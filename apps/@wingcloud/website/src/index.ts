import { createElement } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app.jsx";

createRoot(document.querySelector("#app")!).render(createElement(App));
