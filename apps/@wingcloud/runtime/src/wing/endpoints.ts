import { connect } from "ngrok";
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
      attributes: {
        url: string;
      };
    };
  };
}

export interface Endpoint {
  path: string;
  url: string;
}

const findLocalEndpoints = async ({ port }: { port: number }) => {
  const res = await fetch(`http://localhost:${port}/trpc/app.explorerTree`);
  if (!res.ok) {
    throw new Error(`failed to fetch endpoints: ${await res.text()}`);
  }
  const items: ExplorerTree = (await res.json()) as any;

  const wingEndpoints: string[] = [];
  findWingEndpoints(items.result.data, wingEndpoints);

  const endpoints: Endpoint[] = [];
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
    endpoints.push({ url: node.result.data.attributes.url, path: endpoint });
  }

  return endpoints;
};

const createPublicEndpoints = async (endpoints: Endpoint[]) => {
  const publicEndpoints: Endpoint[] = [];
  for (let endpoint of endpoints) {
    const port = endpoint.url.split(":").pop();
    if (!port) {
      continue;
    }
    const publicUrl = await connect(Number.parseInt(port));
    const publicEndpoint = { path: endpoint.path, url: publicUrl };
    publicEndpoints.push(publicEndpoint);
    console.log("created pulic endpoint", endpoint, publicEndpoint);
  }

  return publicEndpoints;
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

export const createEndpoints = async ({ port }: { port: number }) => {
  const localEndpoints = await findLocalEndpoints({ port });
  const publicEndpoints = await createPublicEndpoints(localEndpoints);
  return publicEndpoints;
};
