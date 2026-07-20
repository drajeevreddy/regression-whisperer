import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const repos = pgTable("repos", {
  id: serial("id").primaryKey(),
  owner: text("owner").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("repos_owner_name_idx").on(t.owner, t.name)]);

export const prs = pgTable("prs", {
  id: serial("id").primaryKey(),
  repoId: integer("repo_id").references(() => repos.id).notNull(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  branch: text("branch").notNull(),
  author: text("author").notNull(),
  commitSha: text("commit_sha"),
  severity: text("severity").notNull().default("none"),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }).defaultNow().notNull(),
  flamegraph: jsonb("flamegraph"),
  diff: jsonb("diff"),
  explanation: text("explanation"),
}, (t) => [uniqueIndex("prs_repo_number_idx").on(t.repoId, t.number)]);

export const regressions = pgTable("regressions", {
  id: serial("id").primaryKey(),
  prId: integer("pr_id").references(() => prs.id).notNull(),
  functionName: text("function_name").notNull(),
  beforeMs: real("before_ms").notNull(),
  afterMs: real("after_ms").notNull(),
  deltaMs: real("delta_ms").notNull(),
  percentageChange: real("percentage_change").notNull(),
  regression: boolean("regression").notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  regressionId: integer("regression_id").references(() => regressions.id).notNull(),
  matchedPrNumber: integer("matched_pr_number").notNull(),
  matchedPrTitle: text("matched_pr_title").notNull(),
  description: text("description"),
  similarityScore: real("similarity_score").notNull(),
});
