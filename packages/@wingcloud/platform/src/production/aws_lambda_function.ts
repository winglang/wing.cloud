export default (config: any) => {
  const functions = config.resource['aws_lambda_function'];

  if (!functions) {
    return config;
  }

  for (const fn of Object.values(functions) as any[]) {
    fn.tracing_config = {
      mode: 'Active',
    };
  }

  return config;
}
