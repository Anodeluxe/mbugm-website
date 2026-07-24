export function getPlacementSessionTime(dayLabel: string, sessionNo: number) {
  if (sessionNo === 2) return "13.00 - 16.00 WIB";
  return /^(Sabtu|Minggu)\b/i.test(dayLabel)
    ? "08.00 - 11.30 WIB"
    : "09.00 - 11.30 WIB";
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
