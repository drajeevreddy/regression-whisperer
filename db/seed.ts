import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { repos, prs, regressions, matches } from "./schema";

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DEMO_URL;
if (!DATABASE_URL) {
  console.error("Set DATABASE_URL or NEON_DEMO_URL to seed");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function seed() {
  console.log("Seeding database...");

  // Clean existing data
  await db.delete(matches);
  await db.delete(regressions);
  await db.delete(prs);
  await db.delete(repos);

  console.log("Seed complete: all tables cleared.");
  console.log("The app is ready for real GitHub PR analysis.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
