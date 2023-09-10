import fetch from "node-fetch";
import { KeyStore } from "./auth/key-store";
import { EnvironmentContext } from "./environment";

export interface ReportEnvironmentStatusInput {
  environmentId: string,
  status: EnvironmentStatus
};

export type EnvironmentStatus = "deploying" | "running" | "error" | "stopped";

export function useReportStatus(context: EnvironmentContext, keyStore: KeyStore) {
  return async function report(status: EnvironmentStatus) {
    console.log("updating status", status);
    const token = await keyStore.createToken({
      environmentId: context.environment.entryfile,
      status
    });
    await fetch(`${context.wingApiUrl}/report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        environmentId: context.environment.entryfile,
        status
      } as ReportEnvironmentStatusInput)
    });
  }
};
