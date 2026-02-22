/**
 * Production environment validation.
 * Ensures all required env vars are present at runtime; throws a clear error if not.
 * Run at server startup via instrumentation or before first DB/auth use.
 */

const REQUIRED_ENV = [
  "MONGODB_URI",
  "AUTH_SECRET",
] as const;

const OPTIONAL_BUT_RECOMMENDED = [
  "NEXTAUTH_URL",
  "AUTH_TRUST_HOST",
] as const;

function getEnvSchema(): {
  required: readonly string[];
  optional: readonly string[];
} {
  return {
    required: REQUIRED_ENV,
    optional: OPTIONAL_BUT_RECOMMENDED,
  };
}

/**
 * Validates that all required environment variables are set.
 * Call once at startup (e.g. from instrumentation or before first DB access).
 * @throws Error with a clear message listing missing variables
 */
export function validateEnv(): void {
  const { required, optional } = getEnvSchema();
  const missing = required.filter((key) => {
    const value = process.env[key];
    return value === undefined || value === "";
  });

  if (missing.length > 0) {
    const list = missing.join(", ");
    throw new Error(
      `[RAPID ROLE :: FATAL] Missing required environment variables: ${list}. ` +
        "Set them in .env.local (dev) or your Railway/hosting env (production)."
    );
  }

  const missingOptional = optional.filter((key) => {
    const value = process.env[key];
    return value === undefined || value === "";
  });
  if (missingOptional.length > 0 && process.env.NODE_ENV === "production") {
    console.warn(
      "\x1b[33m[RAPID ROLE :: ENV]\x1b[0m Recommended env vars not set:",
      missingOptional.join(", ")
    );
  }
}
