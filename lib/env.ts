function getRequiredEnv(
  name: "MONGODB_URI" | "JWT_SECRET",
  value: string | undefined,
): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  get MONGODB_URI(): string {
    return getRequiredEnv("MONGODB_URI", process.env.MONGODB_URI);
  },
  get JWT_SECRET(): string {
    return getRequiredEnv("JWT_SECRET", process.env.JWT_SECRET);
  },
  GOOGLE_PLACES_KEY: process.env.GOOGLE_PLACES_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  get isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  },
};
