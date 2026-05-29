const VIETNAM_UTC_OFFSET_HOURS = 7;

export function serializeVietnamTimestamp(date: Date): string {
  // Post timestamps are stored as Vietnam wall-clock values in a naive timestamp column.
  const vietnamOffsetMilliseconds = VIETNAM_UTC_OFFSET_HOURS * 60 * 60 * 1000;
  const wallClockTimestamp = date.getTime() - date.getTimezoneOffset() * 60 * 1000;
  const utcTimestamp = wallClockTimestamp - vietnamOffsetMilliseconds;

  return new Date(utcTimestamp).toISOString();
}
