import type { APIRoute } from "astro";

const GITHUB_APP_CLIENT_ID = import.meta.env.GITHUB_APP_CLIENT_ID;
const GITHUB_APP_CLIENT_SECRET = import.meta.env.GITHUB_APP_CLIENT_SECRET;

interface TokenData {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  scope: string;
  token_type: string;
}

const exchangeCode = async (code: string): Promise<TokenData> => {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_APP_CLIENT_ID,
      client_secret: GITHUB_APP_CLIENT_SECRET,
      code: code,
    }),
  });

  if (!response.ok) {
    console.error(response.statusText);
    throw new Error("Failed to exchange code for access token.");
  }

  return await response.json();
};

interface UserInfo {
  login: string;
}

const getUserInfo = async (token: string): Promise<UserInfo> => {
  const response = await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": GITHUB_APP_CLIENT_ID,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(response.statusText);
    throw new Error("Failed to fetch user information.");
  }

  return await response.json();
};

export const GET: APIRoute = async ({ request, cookies, redirect, url }) => {
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("No code found", { status: 401 });
  }

  try {
    const tokenData = await exchangeCode(code);
    if (!tokenData.access_token) {
      return new Response("No token found", { status: 401 });
    }

    const token = tokenData.access_token;
    const userInfo = await getUserInfo(token);

    const username = userInfo.login;

    return redirect(`/dashboard?username=${username}`);
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
