import type { ScheduleItem } from '../src/types';

const remindedIds = new Set<string>();

function localDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(dateStr: string): boolean {
  return dateStr === localDateStr();
}

function isTimeNear(timeStr: string | undefined, windowMinutes = 5): boolean {
  if (!timeStr) return false;
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  const diff = Math.abs(now.getTime() - target.getTime()) / 60000;
  return diff <= windowMinutes;
}

function shouldRemind(item: ScheduleItem): boolean {
  if (!item.needsReminder || item.completed) return false;
  if (!isSameDay(item.date)) return false;

  const remindTime = item.reminderTime || item.time;
  if (remindTime && isTimeNear(remindTime)) return true;

  if (!remindTime) {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 9 && hour <= 10 && !remindedIds.has(`${item.id}-morning`);
  }

  return false;
}

function buildReminderText(item: ScheduleItem): string {
  const parts = [item.title];
  if (item.time) parts.push(item.time);
  if (item.location) parts.push(`@${item.location}`);
  return parts.join(' · ');
}

export function checkReminders(
  schedules: ScheduleItem[],
  onReminder: (text: string) => void,
  isHidden: () => boolean,
): void {
  for (const item of schedules) {
    if (!shouldRemind(item)) continue;

    const key = `${item.id}-${item.reminderTime || item.time || 'default'}`;
    if (remindedIds.has(key)) continue;

    const text = buildReminderText(item);

    if (isHidden()) {
      onReminder(text);
      remindedIds.add(key);
    }
  }
}

export function startReminderLoop(
  getSchedules: () => ScheduleItem[],
  onReminder: (text: string) => void,
  isHidden: () => boolean,
): void {
  setInterval(() => {
    checkReminders(getSchedules(), onReminder, isHidden);
  }, 60_000);

  checkReminders(getSchedules(), onReminder, isHidden);
}
