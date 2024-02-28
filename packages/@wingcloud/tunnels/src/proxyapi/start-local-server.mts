import express from "express";
import type {AddressInfo} from "net";

const app = express();
app.use(express.text({ limit: "10mb", type: "*/*" }));

export const startServer = (handler: (any) => any) => {
  app.use(async (req, res) => {
    console.log("server request body", req.body);
    const subdomain = req.headers["x-wing-subdomain"];
    const { statusCode, headers, body } = await handler({
      subdomain,
      body: req.body ? JSON.stringify(req.body) : undefined,
      headers: req.headers,
      httpMethod: req.method,
      isBase64Encoded: false,
      path: req.path,
      queryStringParameters: req.query
    });

    console.log(statusCode, body, headers, typeof headers, subdomain);
    for (let header in headers) {
      res.setHeader(header, headers[header]);
    }

    if (body) {
      res.statusCode = statusCode
      res.send(body);
    } else {
      res.sendStatus(statusCode);
    }
  });

  const port = Math.floor(Math.random() * 1000 + 3000);
  const server = app.listen(port, () => {
    console.log(`proxy api is running: http://localhost:${port}`);
  });
  const address = server.address();
  
  return {
    port: () => (address as AddressInfo).port,
    close: () => {
      server.close();
    }
  }
};