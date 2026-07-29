import assert from "node:assert/strict";
import {
  formatPlacementSession,
  getPlacementSessionTime,
  groupPlacementSessions,
} from "./placement-sessions.ts";

assert.equal(getPlacementSessionTime("Senin, 7 September 2026", 1), "09.00 - 11.30 WIB");
assert.equal(getPlacementSessionTime("Sabtu, 12 September 2026", 1), "08.00 - 11.30 WIB");
assert.equal(getPlacementSessionTime("Minggu, 13 September 2026", 2), "13.00 - 16.00 WIB");
assert.equal(
  formatPlacementSession({
    dayLabel: "Senin, 7 September 2026",
    sessionNo: 1,
  }),
  "Senin, 7 September 2026, Sesi 1, 09.00 - 11.30 WIB",
);
assert.equal(formatPlacementSession(null), "-");

const groups = groupPlacementSessions([
  { dayLabel: "Senin", sessionNo: 1 },
  { dayLabel: "Senin", sessionNo: 2 },
  { dayLabel: "Sabtu", sessionNo: 1 },
]);

assert.deepEqual(groups.map((group) => group.sessions.length), [2, 1]);
console.log("placement sessions: ok");
