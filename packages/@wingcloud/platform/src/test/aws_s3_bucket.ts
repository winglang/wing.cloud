export default (config: any) => {
  const buckets = config.resource['aws_s3_bucket'];

  if (!buckets) {
    return config;
  }

  for (const bucket of Object.values(buckets) as any[]) {
    bucket.force_destroy = true;
  }

  return config;
}
