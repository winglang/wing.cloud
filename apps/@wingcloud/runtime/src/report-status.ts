import fetch from "node-fetch";

import { type KeyStore } from "./auth/key-store.js";
import { type EnvironmentContext } from "./environment.js";

export interface ReportEnvironmentStatusInput {
  environmentId: string;
  status: EnvironmentStatus;
  data?: Record<string, any>;
}

export type EnvironmentStatus =
  | "deploying"
  | "tests"
  | "running"
  | "error"
  | "stopped";

export function useReportStatus(
  context: EnvironmentContext,
  keyStore: KeyStore,
) {
  return async function report(
    status: EnvironmentStatus,
    payload?: Record<string, any>,
  ) {
    console.log(
      "updating status for environment",
      status,
      context.environment.id,
    );
    const data: ReportEnvironmentStatusInput = {
      environmentId: context.environment.id,
      status,
      data: payload,
    };
    const token = await keyStore.createToken(data);
    await fetch(`${context.wingApiUrl}/environment.report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  };
}
