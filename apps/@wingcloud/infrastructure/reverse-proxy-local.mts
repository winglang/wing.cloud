import type { AddressInfo } from "node:net";

import express from "express";
import { createProxyServer } from "http-proxy";

const app = express();
const proxy = createProxyServer({ changeOrigin: true });

// If we don't handle the error, the server will crash when an origin is not available.
proxy.on("error", (error) => {
  console.error(error);
});

export interface Origin {
  pathPattern: string;
  domainName: string;
}

export interface ReverseProxyServerProps {
  origins: Origin[];
  port?: number;
}

export const startReverseProxyServer = (props: ReverseProxyServerProps) => {
  for (const origin of props.origins) {
    app.all(origin.pathPattern, (req, res) => {
      proxy.web(req, res, {
        target: /^https?:\/\//i.test(origin.domainName)
          ? origin.domainName
          : "https://" + origin.domainName,
      });
    });
  }

  // Start the reverse proxy server
  // random port between 3000 and 3999 is needed since we are running the sim twice for some reason and the server is crashing with EADDRINUSE
  const port = props.port || Math.floor(Math.random() * 1000 + 3000);
  console.log(`proxy server port = ${port}`);
  const server = app.listen(port, () => {
    console.log(`Reverse proxy server is running: http://localhost:${port}`);
    console.log(`Reverse proxy paths and targets:`, props.origins);
  });
  const address = server.address();
  return {
    port: (address as AddressInfo).port,
    async close() {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    },
  };
};
