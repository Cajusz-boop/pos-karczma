/**
 * Synchronizacja imprez z Google Calendar do tabeli events.
 * Pobiera wydarzenia z skonfigurowanych kalendarzy, parsuje liczbę gości,
 * przypisuje domyślny pakiet menu i zapisuje do bazy.
 */
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { parseGuestCount } from "./guestCountParser";

export interface SyncResult {
  added: number;
  updated: number;
  cancelled: number;
  errors: string[];
}

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL i GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY są wymagane");
  }
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  return auth;
}

export async function syncCalendars(): Promise<SyncResult> {
  const result: SyncResult = { added: 0, updated: 0, cancelled: 0, errors: [] };
  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setDate(timeMin.getDate() - 7);
  const timeMax = new Date(now);
  timeMax.setDate(timeMax.getDate() + 90);

  const configs = await prisma.calendarConfig.findMany({
    where: { isActive: true },
    include: { defaultPackage: true },
  });

  if (configs.length === 0) {
    return result;
  }

  let auth;
  try {
    auth = await getAuthClient();
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : "Błąd autentykacji Google");
    await prisma.calendarSyncLog.create({
      data: {
        eventsAdded: 0,
        eventsUpdated: 0,
        eventsCancelled: 0,
        error: result.errors.join("; "),
      },
    });
    return result;
  }

  const calendar = google.calendar({ version: "v3", auth });

  for (const config of configs) {
    try {
      const res = await calendar.events.list({
        calendarId: config.calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      const items = res.data.items ?? [];
      for (const ev of items) {
        if (!ev.id) continue;

        const isCancelled = ev.status === "cancelled";
        const start = ev.start?.dateTime ?? ev.start?.date;
        const end = ev.end?.dateTime ?? ev.end?.date;
        if (!start || !end) continue;

        const startDate = new Date(start);
        const endDate = new Date(end);
        const title = (ev.summary ?? "").slice(0, 500);
        const description = ev.description ?? null;
        const htmlLink = ev.htmlLink ?? null;

        const existing = await prisma.event.findUnique({
          where: { googleEventId: ev.id },
        });

        if (existing) {
          if (isCancelled) {
            await prisma.event.update({
              where: { id: existing.id },
              data: {
                status: "CANCELLED",
                syncedAt: now,
                updatedAt: now,
                title,
                description,
                googleEventUrl: htmlLink,
                startDate,
                endDate,
              },
            });
            result.cancelled++;
          } else {
            const updateData: Parameters<typeof prisma.event.update>[0]["data"] = {
              title,
              description,
              googleEventUrl: htmlLink,
              startDate,
              endDate,
              syncedAt: now,
              updatedAt: now,
            };
            if (existing.guestCountSource !== "MANUAL") {
              const parsed = parseGuestCount(title, description ?? "");
              if (parsed !== null) {
                updateData.guestCount = parsed;
                updateData.guestCountSource = "PARSED";
              }
            }
            await prisma.event.update({
              where: { id: existing.id },
              data: updateData,
            });
            result.updated++;
          }
        } else {
          if (isCancelled) continue;

          const parsed = parseGuestCount(title, description ?? "");
          const guestCount = parsed;
          const guestCountSource = parsed !== null ? ("PARSED" as const) : ("MANUAL" as const);
          const packageId = config.defaultPackageId ?? null;
          const status =
            guestCount != null && packageId != null ? "CONFIRMED" : "DRAFT";

          await prisma.event.create({
            data: {
              googleEventId: ev.id,
              googleCalendarId: config.calendarId,
              calendarName: config.calendarName,
              eventType: config.eventType,
              title,
              description,
              googleEventUrl: htmlLink,
              startDate,
              endDate,
              roomName: config.roomName,
              guestCount,
              guestCountSource,
              packageId,
              status,
              syncedAt: now,
            },
          });
          result.added++;
        }
      }
    } catch (e) {
      result.errors.push(
        `Kalendarz ${config.calendarName}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  await prisma.calendarSyncLog.create({
    data: {
      eventsAdded: result.added,
      eventsUpdated: result.updated,
      eventsCancelled: result.cancelled,
      error: result.errors.length > 0 ? result.errors.join("; ") : null,
    },
  });

  return result;
}
