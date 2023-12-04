import { createHash } from "node:crypto";

import fetch from "node-fetch";

interface ExplorerItem {
  id: string;
  label: string;
  type?: string;
  childItems?: ExplorerItem[];
}

interface ExplorerTree {
  result: {
    data: ExplorerItem;
  };
}

interface Node {
  result: {
    data: {
      type: string;
      attributes: {
        url: string;
      };
    };
  };
}

interface LocalEndpoint {
  path: string;
  url: string;
  port: number;
  type: string;
}

export interface Endpoint {
  path: string;
  url: string;
  port: number;
  type: string;
  digest: string;
}

const findLocalEndpoints = async ({ port }: { port: number }) => {
  const res = await fetch(`http://localhost:${port}/trpc/app.explorerTree`);
  if (!res.ok) {
    throw new Error(`failed to fetch endpoints: ${await res.text()}`);
  }
  const items: ExplorerTree = (await res.json()) as any;

  const wingEndpoints: string[] = [];
  findWingEndpoints(items.result.data, wingEndpoints);

  const localEndpoints: LocalEndpoint[] = [];
  for (let endpoint of wingEndpoints) {
    const res = await fetch(
      `http://localhost:${port}/trpc/app.node?input=${encodeURIComponent(
        JSON.stringify({
          path: endpoint,
        }),
      )}`,
    );
    if (!res.ok) {
      throw new Error(`failed to get node: ${await res.text()}`);
    }

    const node: Node = (await res.json()) as any;
    const portParts = node.result.data.attributes.url.split(":");
    const localPort = Number.parseInt(portParts.at(-1)!, 10);
    localEndpoints.push({
      url: node.result.data.attributes.url,
      path: endpoint,
      port: localPort,
      type: node.result.data.type,
    });
  }

  return localEndpoints;
};

export const findEndpoints = () => {
  let endpoints: Array<Endpoint> | undefined;
  const endpointsByDigest: Record<string, Endpoint> = {};
  const endpointsByPort: Record<number, Endpoint> = {};
  return async ({
    environmentId,
    port,
  }: {
    environmentId: string;
    port: number;
  }) => {
    if (!endpoints) {
      const localEndpoints = await findLocalEndpoints({ port });
      endpoints = localEndpoints.map((e) => {
        const digest = createHash("sha256")
          .update(`${environmentId}-${e.path}`)
          .digest("hex")
          .slice(0, 16);
        const endpoint = {
          digest,
          url: e.url,
          path: e.path,
          port: e.port,
          type: e.type,
        };

        endpointsByDigest[digest] = endpoint;
        endpointsByPort[e.port] = endpoint;

        return endpoint;
      });
    }

    return { endpoints, endpointsByDigest, endpointsByPort };
  };
};

const findWingEndpoints = (item: ExplorerItem, endpoints: string[]) => {
  if (
    item.type == "@winglang/sdk.ex.ReactApp" ||
    item.type == "@winglang/sdk.cloud.Api" ||
    item.type == "@winglang/sdk.cloud.Website"
  ) {
    endpoints.push(item.id);
  }

  for (let child of item.childItems ?? []) {
    findWingEndpoints(child, endpoints);
  }
};
