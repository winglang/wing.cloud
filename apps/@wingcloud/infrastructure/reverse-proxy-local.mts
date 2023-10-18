import type { AddressInfo } from "node:net";

import express from "express";
import httpProxy from "http-proxy";

const app = express();
const proxy = httpProxy.createProxyServer({ changeOrigin: true });

export interface Origin {
  pathPattern: string;
  domainName: string;
}
export interface ReverseProxyServerProps {
  origins: Origin[];
  port?: number;
}
export const startReverseProxyServer = (
  props: ReverseProxyServerProps,
): number => {
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
  const server = app.listen(port, () => {
    console.log(`Reverse proxy server is running: http://localhost:${port}`);
    console.log(`Reverse proxy paths and targets:`, props.origins);
  });
  const address = server.address();
  return (address as AddressInfo).port;
};
