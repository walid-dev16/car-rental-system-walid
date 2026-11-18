const berlin = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
const dayMs = 86_400_000;
const wallTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// URL bookmarks created by older versions use instants. Current forms use Berlin wall times.
export function branchTimeInput(value) {
  if (!value) return "";
  if (typeof value === "string" && wallTime.test(value)) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = Object.fromEntries(berlin.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

// Test both offsets near a clock change; PostgreSQL chooses the later occurrence of a repeated hour.
function branchInstant(value) {
  if (!wallTime.test(value)) return NaN;
  const wall = Date.parse(value + ":00Z");
  if (!Number.isFinite(wall)) return NaN;
  for (const reference of [wall + dayMs, wall - dayMs]) {
    const offset = Date.parse(branchTimeInput(reference) + ":00Z") - reference;
    const instant = wall - offset;
    if (branchTimeInput(instant) === value) return instant;
  }
  return NaN;
}

export function rentalPeriod(pickup, dropoff) {
  const start = branchInstant(pickup);
  const end = branchInstant(dropoff);
  if (!pickup || !dropoff) return { error: "Choose both pickup and return dates." };
  if (!Number.isFinite(start) || !Number.isFinite(end)) return { error: "Choose a valid time in Berlin." };
  if (start < Date.now()) return { error: "Pickup must be in the future." };
  if (end <= start) return { error: "Return must be after pickup." };
  return { days: Math.ceil((end - start) / dayMs) };
}

export function formatBranchTime(value) {
  if (!value) return "Not recorded";
  const date = new Date(wallTime.test(value) ? branchInstant(value) : value);
  return Number.isFinite(date.getTime()) ? berlin.format(date) + " (Berlin)" : "Not recorded";
}
