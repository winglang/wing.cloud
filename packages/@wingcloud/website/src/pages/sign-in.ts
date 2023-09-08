import type { APIRoute } from "astro";
import * as jose from "jose";

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const secret = new TextEncoder().encode(
    "cc7e0d44fd473002f1c42167459001140ec6389b7353f8088f4d9a95f2f596f2",
  );
  const jwt = await new jose.SignJWT({})
    .setSubject("skyrpex")
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);

  // const jwt = await new jose.EncryptJWT({})
  //   .setSubject("skyrpex")
  //   .setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256" })
  //   .setIssuedAt()
  //   .setExpirationTime("1h")
  //   .encrypt(secret);

  console.log(jwt);

  cookies.set("Authorization", jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  return new Response(
    JSON.stringify({
      body: "Hello, world!",
      jwt,
    }),
  );

  // const auth = getAuth(app);

  // /* Get token from request headers */
  // const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
  // if (!idToken) {
  //   return new Response("No token found", { status: 401 });
  // }

  // /* Verify id token */
  // try {
  //   await auth.verifyIdToken(idToken);
  // } catch (error) {
  //   return new Response("Invalid token", { status: 401 });
  // }

  // /* Create and set session cookie */
  // const fiveDays = 60 * 60 * 24 * 5 * 1000;
  // const sessionCookie = await auth.createSessionCookie(idToken, {
  //   expiresIn: fiveDays,
  // });

  // cookies.set("session", "my-cookie", {
  //   path: "/",
  // });

  // return redirect("/dashboard");
};
