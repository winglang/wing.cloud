# `@wingcloud/express-cookies`

An `express` middleware to manage cookies.

## Usage

```ts
// Setup middleware.
import express from "express";
import { createCookiesMiddleware } from "@wingcloud/express-cookies";

const app = express();

app.use(createCookiesMiddleware());

// Use cookies.
import { cookiesFromRequest } from "@wingcloud/express-cookies";

app.get("/", (req, res) => {
  const cookies = cookiesFromRequest(req);
  const name = cookies.get("name");

  cookies.set("name", `Not ${name}`);
});
```
