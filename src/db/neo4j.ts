import neo4j, { Driver } from "neo4j-driver";
import { env } from "../config/env";

let driver: Driver;

export const getDriver = (): Driver => {
  if (!driver) {
    driver = neo4j.driver(
      env.NEO4J_URI,
      neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD),
    );
  }
  return driver;
};

// Call this on server shutdown
export const closeDriver = async (): Promise<void> => {
  if (driver) {
    await driver.close();
  }
};

// Quick connectivity check on startup
export const verifyNeo4jConnection = async (): Promise<void> => {
  const driver = getDriver();
  try {
    await driver.verifyConnectivity();
    console.log("✅ Neo4j connected");
  } catch (error) {
    console.error("❌ Neo4j connection failed:", error);
    throw error;
  }
};
