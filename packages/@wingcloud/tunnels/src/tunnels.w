bring cloud;
bring util;
bring websockets;
bring "./connections.w" as conn;
bring "./proxyapi/proxyapi.w" as proxyapi;
bring "./proxyapi/proxyapi.types.w" as proxytypes;

struct Message {
  action: str;
}

struct InitializeMessage extends Message {
  subdomain: str?;
}

struct InitializedMessage extends Message {
  subdomain: str;
  url: str;
}

struct ForwardRequestMessage extends Message {
  requestId: str;
  path: str;
  method: str;
  headers: Map<str>?;
  query: Map<str>?;
  body: str?;
}

struct ForwardResponseMessage extends Message {
  requestId: str;
  status: num;
  path: str;
  method: str;
  headers: Map<str>?;
  body: str?;
}

struct ErrorMessage extends Message {
  type: str;
  message: str;
}

pub struct TunnelsApiProps {
  zoneName: str;
  subDomain: str;
  connections: conn.IConnections?;
}

pub class TunnelsApi {
  ws: websockets.WebSocket;
  api: proxyapi.ProxyApi;
  new(props: TunnelsApiProps) {
    let connections = () => {
      if let connections = props.connections {
        return connections;
      } else {
        return new conn.Connections();
      }
    }();
    this.ws = new websockets.WebSocket(name: "tunnels-{props.subDomain}");

    this.api = new proxyapi.ProxyApi(inflight (event: proxytypes.IProxyApiEvent): proxytypes.IProxyApiResponse => {
      let connection = connections.findConnectionBySubdomain(event.subdomain);
      if connection == nil {
        return {
          statusCode: 404,
          body: "Subdomain Not Found",
        };
      }

      let requestId = util.nanoid();
      let var body = event.body;
      if let b = body {
        body = util.base64Encode(b);
      }
      this.ws.sendMessage(connection?.connectionId ?? "", Json.stringify(ForwardRequestMessage{
        action: "FORWARD_REQUEST",
        requestId: requestId,
        path: event.path,
        method: event.httpMethod,
        headers: event.headers,
        query: event.queryStringParameters,
        body: body
      }));

      let found = util.waitUntil(inflight () => {
        let req = connections.findResponseForRequest(requestId);
        return req != nil;
      }, timeout: 10s);

      if (!found) {
        return {
          statusCode: 500,
          body: "No Server Response",
        };
      }

      let req = MutJson connections.findResponseForRequest(requestId);
      if let body = req.tryGet("body") {
        req.set("body", util.base64Decode(body.asStr()));
      }
      let response = ForwardResponseMessage.fromJson(req);
      connections.removeResponseForRequest(requestId);

      return {
        statusCode: response.status,
        body: response.body,
        headers: response.headers
      };
    }, zoneName: props.zoneName, subDomain: props.subDomain) as "tunnels public endpoint";
    
    
    this.ws.onConnect(inflight (connectionId: str) => {
      log("onConnect: {connectionId}");  
    });
    
    this.ws.onDisconnect(inflight (connectionId: str) => {
      connections.removeConnection(connectionId);
    });
    
    this.ws.onMessage(inflight (connectionId: str, message: str) => {
      log("onMessage: {connectionId}");
    
      let jsn = Json.tryParse(message);
      if jsn == nil {
        return;
      }
    
      let msg = Message.tryFromJson(jsn);
      if msg == nil {
        return;
      }
    
      if msg?.action == "INITIALIZE" {
        let initialize = InitializeMessage.fromJson(jsn);
        let subdomain = initialize.subdomain ?? util.nanoid(alphabet: "0123456789abcdefghij", size: 10);

        let isConnected = util.waitUntil(inflight () => {
          try {
            connections.addConnectionWithSubdomain(conn.Connection{
              connectionId: connectionId,
              subdomain: subdomain
            });
            return true;
          } catch err {
            log("error adding connection {connectionId}: {err}");
            return false;
          }
        }, timeout: 3s, interval: 250ms);

        if !isConnected {
          this.ws.sendMessage(connectionId, Json.stringify(ErrorMessage{
            action: "ERROR",
            type: "SUBDOMAIN_IN_USE",
            message: "Subdomain {subdomain} already in use",
          }));
          return;
        }
        
        this.ws.sendMessage(connectionId, Json.stringify(InitializedMessage{
          action: "INITIALIZED",
          subdomain: subdomain,
          url: "https://{subdomain}.{props.subDomain}.{props.zoneName}"
        }));
      } elif msg?.action == "FORWARD_RESPONSE" {
        let response = ForwardResponseMessage.fromJson(jsn);
        connections.addResponseForRequest(response.requestId, response);
      }
    });
  }

  pub inflight wsUrl(): str {
    return this.ws.url;
  }

  pub inflight apiUrl(): str {
    return this.api.url();
  }
}
