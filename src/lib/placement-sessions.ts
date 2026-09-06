import { config } from "./config";

const MONTHS: Record<string, string> = {
  januari: "01",
  februari: "02",
  maret: "03",
  april: "04",
  mei: "05",
  juni: "06",
  juli: "07",
  agustus: "08",
  september: "09",
  oktober: "10",
  november: "11",
  desember: "12",
};

function placementDateValue(dayLabel: string) {
  const match = dayLabel.match(/,\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*$/);
  const month = match && MONTHS[match[2].toLowerCase()];
  return match && month
    ? `${match[3]}-${month}-${match[1].padStart(2, "0")}`
    : null;
}

function todayInJakarta(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function getPlacementSessionUnavailableReason(
  dayLabel: string,
  sessionNo: number,
  now: Date = new Date(),
) {
  const date = placementDateValue(dayLabel);
  if (!date) return "Tanggal sesi tidak valid.";
  if (date <= todayInJakarta(now)) return "Tanggal ini sudah tidak tersedia.";
  if ((config.unavailablePlacementDates as readonly string[]).includes(date)) {
    return "Tanggal ini tidak tersedia selama perpanjangan pendaftaran.";
  }
  if (
    (config.unavailablePlacementSessions as readonly string[]).includes(
      `${date}/${sessionNo}`,
    )
  ) {
    return "Sesi ini tidak tersedia.";
  }
  return null;
}

export function getPlacementSessionTime(dayLabel: string, sessionNo: number) {
  if (sessionNo === 2) return "13.00 - 16.00 WIB";
  return /^(Sabtu|Minggu)\b/i.test(dayLabel)
    ? "08.00 - 11.30 WIB"
    : "09.00 - 11.30 WIB";
}

export function formatPlacementSession(
  session?: { dayLabel: string; sessionNo: number } | null,
) {
  if (!session) return "-";
  return `${session.dayLabel}, Sesi ${session.sessionNo}, ${getPlacementSessionTime(session.dayLabel, session.sessionNo)}`;
}

export function groupPlacementSessions<T extends { dayLabel: string }>(sessions: readonly T[]) {
  const groups = new Map<string, T[]>();
  for (const session of sessions) {
    const group = groups.get(session.dayLabel) ?? [];
    group.push(session);
    groups.set(session.dayLabel, group);
  }
  return Array.from(groups, ([dayLabel, groupedSessions]) => ({
    dayLabel,
    sessions: groupedSessions,
  }));
}
