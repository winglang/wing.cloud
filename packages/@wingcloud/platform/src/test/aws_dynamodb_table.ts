export default (config: any) => {
  const tables = config.resource['aws_dynamodb_table'];

  if (!tables) {
    return config;
  }

  for (const table of Object.values(tables) as any[]) {
    table.billing_mode = 'PAY_PER_REQUEST';
  }

  return config;
}
