import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../drizzle/0004_enforce_session_quota.sql", import.meta.url),
  "utf8",
);
const action = await readFile(
  new URL("../src/server/actions/submit-application.ts", import.meta.url),
  "utf8",
);
const service = await readFile(
  new URL(
    "../src/server/application/application-submission-service.ts",
    import.meta.url,
  ),
  "utf8",
);

assert.match(migration, /FOR UPDATE/);
assert.match(migration, /session_quota_not_exceeded/);
assert.match(action, /submissionService\.execute\(formData, ip\)/);
assert.doesNotMatch(action, /db\./);
assert.doesNotMatch(service, /bookedCount/);
assert.match(service, /databaseError\.constraint === "session_quota_not_exceeded"/);
console.log("session quota: atomic database guard configured");
