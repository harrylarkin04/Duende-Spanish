/** Monday 00:00:00.000 UTC for the week containing `d`. */
export function weekStartUtcIso(d: Date = new Date()): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = x.getUTCDay(); // 0 Sun .. 6 Sat
  const daysFromMonday = (dow + 6) % 7;
  x.setUTCDate(x.getUTCDate() - daysFromMonday);
  x.setUTCHours(0, 0, 0, 0);
  return x.toISOString();
}
