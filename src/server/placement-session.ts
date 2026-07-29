import { eq } from "drizzle-orm";
import { formatPlacementSession } from "@/lib/placement-sessions";
import { db } from "@/server/db";
import { sessions } from "@/server/db/schema";

export async function getPlacementSessionLabel(sessionId: number | null) {
  if (!sessionId) return "-";
  const session = await db.query.sessions.findFirst({
    columns: { dayLabel: true, sessionNo: true },
    where: eq(sessions.id, sessionId),
  });
  return formatPlacementSession(session);
}
