import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

async function fetchParameterValue(key: string): Promise<string> {
  const client = new SSMClient({});
  const command = new GetParameterCommand({ Name: key, WithDecryption: true });
  const response = await client.send(command);
  return response.Parameter?.Value ?? "";
}

exports.fetchParameterValue = fetchParameterValue;