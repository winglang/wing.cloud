/**
 * Returns the value of the environment variable, or throws an error if it is not defined.
 */
export const getEnvironmentVariable = (name: string) => {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Environment variable [${name}] is not defined.`);
  }
  return value;
};
