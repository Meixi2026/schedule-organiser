import { parseISO, isPast, differenceInHours } from 'date-fns';
import type { EventType, ScheduleItem } from '../types';

export type ScheduleUrgency = 'overdue' | 'due-soon' | 'normal';

export const TYPE_CSS_CLASS: Record<EventType, string> = {
  工作: 'type-work',
  学习: 'type-study',
  生活: 'type-life',
  社交: 'type-social',
  健康: 'type-health',
  DDL: 'type-ddl',
  其他: 'type-other',
};

export function getTypeClass(type: EventType): string {
  return TYPE_CSS_CLASS[type] ?? 'type-other';
}

export function getScheduleUrgency(item: ScheduleItem): ScheduleUrgency {
  if (item.completed) return 'normal';
  const date = parseISO(item.date);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  if (isPast(dayEnd)) return 'overdue';
  if (item.isDeadline && differenceInHours(dayEnd, new Date()) <= 24) return 'due-soon';
  return 'normal';
}

export function formatTimeDisplay(time?: string): string {
  if (!time) return '全天';
  return time;
}

export function formatSubtaskLine(date: string, title: string, time?: string): string {
  const parts = [date, time, title].filter(Boolean);
  return parts.join(' ');
}

export function getSubtaskProgress(subTasks?: ScheduleItem['subTasks']): {
  done: number;
  total: number;
} {
  if (!subTasks?.length) return { done: 0, total: 0 };
  const done = subTasks.filter((s) => s.completed).length;
  return { done, total: subTasks.length };
}

export function isDatePast(dateStr: string): boolean {
  const date = parseISO(dateStr);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  return isPast(dayEnd);
}

export function hasSchedulesOnDate(schedules: ScheduleItem[], dateStr: string): boolean {
  return schedules.some((s) => s.date === dateStr && !s.completed);
}

export function getWeekDates(anchor: Date): string[] {
  const day = anchor.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}
