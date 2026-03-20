import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = [
  "DATABASE_URL",
  "NEO4J_URI",
  "NEO4J_USERNAME",
  "NEO4J_PASSWORD",
  "ANTHROPIC_API_KEY",
  "PORT",
  "FRONTEND_URL",
] as const;

// Fail fast — if any env var is missing, crash immediately with a clear message
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  NEO4J_URI: process.env.NEO4J_URI!,
  NEO4J_USERNAME: process.env.NEO4J_USERNAME!,
  NEO4J_PASSWORD: process.env.NEO4J_PASSWORD!,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
  PORT: parseInt(process.env.PORT!),
  FRONTEND_URL: process.env.FRONTEND_URL!,
} as const;
