import { resolve } from "node:path";

try {
  process.loadEnvFile(resolve(__dirname, "../../.env.local"));
} catch {
  // Env vars may already be exported by the shell; checked in helpers.ts.
}
