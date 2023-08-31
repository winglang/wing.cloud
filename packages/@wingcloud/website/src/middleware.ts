import { defineMiddleware, sequence } from "astro:middleware";

const auth = defineMiddleware(async ({ url, cookies, generator }, next) => {
  // if (url.pathname !== "/") {

  // }
  const response = await next();
  console.log("auth response");
  response.headers.set("x-astro", generator);
  return response;
});

// const greeting = defineMiddleware(async (_, next) => {
//   console.log("greeting request");
//   const response = await next();
//   console.log("greeting response");
//   return response;
// });

export const onRequest = sequence(
  auth,
  // greeting
);
