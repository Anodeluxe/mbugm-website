import assert from "node:assert/strict";
import {
  formatPlacementSession,
  getPlacementSessionUnavailableReason,
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

const septemberFirst = new Date("2026-09-01T00:00:00+07:00");
assert.match(
  getPlacementSessionUnavailableReason(
    "Selasa, 1 September 2026",
    septemberFirst,
  ),
  /sudah tidak tersedia/,
);
assert.equal(
  getPlacementSessionUnavailableReason(
    "Senin, 7 September 2026",
    septemberFirst,
  ),
  null,
);
assert.match(
  getPlacementSessionUnavailableReason(
    "Sabtu, 12 September 2026",
    septemberFirst,
  ),
  /perpanjangan/,
);
assert.match(
  getPlacementSessionUnavailableReason(
    "Senin, 31 Agustus 2026",
    new Date("2026-09-02T12:00:00+07:00"),
  ),
  /sudah tidak tersedia/,
);

const groups = groupPlacementSessions([
  { dayLabel: "Senin", sessionNo: 1 },
  { dayLabel: "Senin", sessionNo: 2 },
  { dayLabel: "Sabtu", sessionNo: 1 },
]);

assert.deepEqual(groups.map((group) => group.sessions.length), [2, 1]);
console.log("placement sessions: ok");
