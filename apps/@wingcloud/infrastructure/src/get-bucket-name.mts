export const getBucketName = () => {
  const key = Object.keys(process.env).find((k) =>
    k.startsWith("BUCKET_NAME_"),
  );
  console.log("bucket", key);
  return process.env[key!]!;
};
