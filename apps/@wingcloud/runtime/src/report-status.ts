import fetch from "node-fetch";

import { type KeyStore } from "./auth/key-store.js";
import { type EnvironmentContext } from "./environment.js";

export interface ReportEnvironmentStatusInput {
  environmentId: string;
  status: EnvironmentStatus;
  data?: Record<string, any>;
  timestamp: number;
}

export type EnvironmentStatus =
  | "deploying"
  | "running-server"
  | "running-tests"
  | "tests-error"
  | "running"
  | "error"
  | "stopped";

export function useReportStatus(
  context: EnvironmentContext,
  keyStore: KeyStore,
) {
  let lastStatus: EnvironmentStatus | undefined;
  return async function report(
    status: EnvironmentStatus,
    payload?: Record<string, any>,
  ) {
    if (lastStatus === "error") {
      console.log("discard status", status);
      return;
    }

    console.log(
      "updating status for environment",
      status,
      context.environment.id,
    );
    const data: ReportEnvironmentStatusInput = {
      environmentId: context.environment.id,
      status,
      data: payload,
      timestamp: Date.now(),
    };
    console.log("before keyStore.createToken");
    const token = await keyStore.createToken({
      environmentId: data.environmentId,
    });
    console.log("after keyStore.createToken");
    lastStatus = status;
    console.log("before await fetch environment.report");
    await fetch(`${context.wingApiUrl}/environment.report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...data,
      }),
    });
    console.log("after await fetch environment.report");
  };
}
