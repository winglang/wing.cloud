import { dotenv } from "./dotenv-plugin.js";

/**
 * @return {import("vite").Plugin[]}
 */
export default () => [dotenv()];
