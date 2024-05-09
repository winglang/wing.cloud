/* eslint-disable unicorn/no-array-push-push */
import * as cdktf from "@cdktf/provider-aws";
import {
  Api,
  Endpoint,
  type ApiConnectOptions,
  type ApiDeleteOptions,
  type ApiGetOptions,
  type ApiHeadOptions,
  type ApiOptionsOptions,
  type ApiPatchOptions,
  type ApiPostOptions,
  type ApiProps,
  type ApiPutOptions,
  type IApiEndpointHandler,
} from "@winglang/sdk/lib/cloud";
import { Api as cloudApi } from "@winglang/sdk/lib/cloud";
import { lift, inflight } from "@winglang/sdk/lib/core";
import { App, Lifting } from "@winglang/sdk/lib/core";
import {
  ResourceNames,
  type NameOptions,
} from "@winglang/sdk/lib/shared/resource-names.js";
import { ApiEndpointHandler } from "@winglang/sdk/lib/shared-aws";
import { Duration, Node } from "@winglang/sdk/lib/std";
import { App as TfAwsApp } from "@winglang/sdk/lib/target-tf-aws/app.js";
import { Schedule } from "@winglang/sdk/lib/target-tf-aws/schedule.js";
import type { Construct } from "constructs";

import { CustomFunction } from "./function.js";

export class CustomApi extends Api {
  NAME_OPTS: NameOptions = {
    // eslint-disable-next-line unicorn/better-regex
    disallowedRegex: /[^a-zA-Z0-9\_\-]+/g,
  };

  handlers: Record<string, IApiEndpointHandler> = {};
  func: CustomFunction;
  handlersLines: string[] = [];
  endpoint: Endpoint;
  constructor(scope: Construct, id: string, props: ApiProps = {}) {
    super(scope, id, props);
    this.func = new CustomFunction(
      this.handlersLines,
      this,
      `${id}-function`,
      // eslint-disable-next-line @typescript-eslint/require-await
      inflight(async (_ctx, e) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        const event: any = e as unknown;
        console.log(JSON.stringify(event, undefined, 2));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const fn =
          // eslint-disable-next-line unicorn/prefer-module
          exports[
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            `${event.httpMethod.toUpperCase()}__${event.path.slice(5) || "/"}`
          ];
        if (!fn) {
          return {
            isBase64Encoded: false,
            statusCode: 404,
            headers: {},
            body: "Not Found",
          };
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return fn(event);
      }),
    );
    const api = new cdktf.apigatewayv2Api.Apigatewayv2Api(this, `${id}`, {
      name: ResourceNames.generateName(this, this.NAME_OPTS),
      protocolType: "HTTP",
    });

    const integration =
      new cdktf.apigatewayv2Integration.Apigatewayv2Integration(
        this,
        "integration",
        {
          apiId: api.id,
          integrationType: "AWS_PROXY",
          integrationUri: this.func.invokeArn,
          integrationMethod: "POST",
          payloadFormatVersion: "1.0",
        },
      );

    new cdktf.apigatewayv2Route.Apigatewayv2Route(this, "route", {
      apiId: api.id,
      routeKey: "$default",
      target: `integrations/\${${integration.id}\}`,
    });

    const stageName = "prod";
    new cdktf.apigatewayv2Stage.Apigatewayv2Stage(this, "stage", {
      apiId: api.id,
      name: stageName,
      autoDeploy: true,
    });

    new cdktf.lambdaPermission.LambdaPermission(this, "lambda permission", {
      action: "lambda:InvokeFunction",
      functionName: this.func.functionName,
      principal: "apigateway.amazonaws.com",
      sourceArn: `${api.executionArn}/*/*`,
    });

    const url = `https://${api.id}.execute-api.${(App.of(this) as TfAwsApp).region}.amazonaws.com/${stageName}`;
    this.endpoint = new Endpoint(this, "Endpoint", url, {
      label: `Api ${this.node.path}`,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (App.of(scope).parameters.value(id)?.warmLambdas === "true") {
      const schedule = new Schedule(this, "Schedule", {
        rate: Duration.fromMinutes(5),
      });
      const onTickHandler = lift({ url }).inflight(async (ctx) => {
        try {
          console.log("Warming up");
          const promises = [];
          for (let i = 0; i < 50; i++) {
            promises.push(fetch(ctx.url + "/_ready"));
          }
          await Promise.all(promises);
          console.log("Warming up done");
        } catch (error) {
          console.error(error);
        }
      });
      const onTickFn = schedule.onTick(onTickHandler);
      Lifting.lift(onTickHandler, onTickFn, ["handle"]);
    }
  }

  protected get _endpoint(): Endpoint {
    return this.endpoint;
  }

  public get(
    path: string,
    inflight: IApiEndpointHandler,
    props?: ApiGetOptions,
  ): void {
    this.httpRequests("GET", path, inflight, props);
  }

  public post(
    path: string,
    inflight: IApiEndpointHandler,
    props?: ApiPostOptions,
  ): void {
    this.httpRequests("POST", path, inflight, props);
  }

  public put(
    path: string,
    inflight: IApiEndpointHandler,
    props?: ApiPutOptions,
  ): void {
    this.httpRequests("PUT", path, inflight, props);
  }

  public delete(
    path: string,
    inflight: IApiEndpointHandler,
    props?: ApiDeleteOptions,
  ): void {
    this.httpRequests("DELETE", path, inflight, props);
  }

  public patch(
    path: string,
    inflight: IApiEndpointHandler,
    props?: ApiPatchOptions,
  ): void {
    this.httpRequests("PATCH", path, inflight, props);
  }

  public options(
    path: string,
    inflight: IApiEndpointHandler,
    props?: ApiOptionsOptions,
  ): void {
    this.httpRequests("OPTIONS", path, inflight, props);
  }

  public head(
    path: string,
    inflight: IApiEndpointHandler,
    props?: ApiHeadOptions,
  ): void {
    this.httpRequests("HEAD", path, inflight, props);
  }

  public connect(
    path: string,
    inflight: IApiEndpointHandler,
    props?: ApiConnectOptions,
  ): void {
    this.httpRequests("CONNECT", path, inflight, props);
  }

  private httpRequests(
    method: string,
    path: string,
    inflight: IApiEndpointHandler,
    props?: ApiGetOptions,
  ): void {
    const lowerMethod = method.toLowerCase();

    if (props) {
      console.warn(`Api.${lowerMethod} does not support props yet`);
    }
    this._validatePath(path);

    this.handlers[`${method}__${path}`] = inflight;
    Node.of(this.func).addDependency(inflight);
  }

  public _preSynthesize(): void {
    super._preSynthesize();

    // eslint-disable-next-line @typescript-eslint/require-await
    const readyHandler = inflight(async () => {
      return {
        isBase64Encoded: false,
        statusCode: 200,
        headers: {},
        body: "OK",
      };
    });

    this.handlers["GET__/_ready"] = readyHandler;

    for (const [id, handler] of Object.entries(this.handlers)) {
      const lines = this.getHandlerLines(id, handler);
      this.handlersLines.push(...lines);

      Lifting.lift(handler, this.func, ["handle"]);
    }
  }

  protected getHandlerLines(
    id: string,
    handler: IApiEndpointHandler,
  ): string[] {
    const newInflight = ApiEndpointHandler.toFunctionHandler(
      handler,
      cloudApi.renderCorsHeaders(this.corsOptions)?.defaultResponse,
    );

    const inflightClient = newInflight._toInflight();
    const lines = new Array<string>();
    lines.push(`exports["${id}"] = async function(event) {`);
    lines.push(
      `  $handlers["${id}"] = $handlers["${id}"] ?? (${inflightClient});`,
    );
    lines.push(`  return await $handlers["${id}"].handle(event);`);
    lines.push("};");
    return lines;
  }
}
