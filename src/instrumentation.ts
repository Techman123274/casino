/**
 * Runs once when the Next.js server starts.
 * Use for env validation and other bootstrap that must run before handling requests.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
