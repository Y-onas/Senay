/** Request dates/times are interpreted in Ethiopian local time, not the server TZ. */
export const ADDIS_TIME_ZONE = "Africa/Addis_Ababa";

export type AddisNow = {
  date: string;
  time: string;
};

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((item) => item.type === type)?.value ?? "";
}

export function getAddisNow(at = new Date()): AddisNow {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ADDIS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);

  const year = part(parts, "year");
  const month = part(parts, "month");
  const day = part(parts, "day");
  let hour = part(parts, "hour");
  const minute = part(parts, "minute");
  if (hour === "24") hour = "00";

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`,
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export function isAddisDateInPast(dateIso: string, now: AddisNow = getAddisNow()): boolean {
  return DATE_RE.test(dateIso) && dateIso < now.date;
}

export function isAddisDateTimeInPast(
  dateIso: string,
  time: string,
  now: AddisNow = getAddisNow(),
): boolean {
  if (!DATE_RE.test(dateIso) || !TIME_RE.test(time)) return false;
  if (dateIso < now.date) return true;
  if (dateIso > now.date) return false;
  return time < now.time;
}

/** Calendar date in Addis Ababa, stored so the day does not shift in UTC. */
export function parseAddisCalendarDate(dateIso: string): Date {
  return new Date(`${dateIso}T12:00:00+03:00`);
}

export function validatePreferredDateTime(
  dateIso?: string | null,
  time?: string | null,
): string | null {
  if (!dateIso) return null;
  if (!DATE_RE.test(dateIso) || Number.isNaN(Date.parse(`${dateIso}T12:00:00+03:00`))) {
    return "Invalid preferred date";
  }

  const now = getAddisNow();
  if (isAddisDateInPast(dateIso, now)) {
    return "Preferred date has already passed";
  }

  if (time) {
    if (!TIME_RE.test(time)) return "Invalid preferred time";
    if (isAddisDateTimeInPast(dateIso, time, now)) {
      return "Preferred time has already passed";
    }
  }

  return null;
}
