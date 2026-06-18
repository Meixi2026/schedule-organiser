import { parseISO, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ScheduleItem } from '../types';
import { getWeekDates, hasSchedulesOnDate, toDateString } from '../utils/scheduleDisplay';

interface Props {
  schedules: ScheduleItem[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
}

export default function WeekStrip({ schedules, selectedDate, onSelectDate }: Props) {
  const today = toDateString(new Date());
  const weekDates = getWeekDates(new Date());

  return (
    <div className="week-strip">
      {weekDates.map((dateStr) => {
        const date = parseISO(dateStr);
        const isToday = dateStr === today;
        const hasItems = hasSchedulesOnDate(schedules, dateStr);
        const dayLabel = format(date, 'EEE', { locale: zhCN });
        const dayNum = format(date, 'd');

        return (
          <button
            key={dateStr}
            type="button"
            className={`week-day ${isToday ? 'today' : ''} ${hasItems ? 'has-items' : ''} ${selectedDate === dateStr ? 'selected' : ''}`}
            onClick={() => onSelectDate?.(dateStr)}
            title={format(date, 'M月d日', { locale: zhCN })}
          >
            <span className="week-day-label">{dayLabel}</span>
            <span className="week-day-num">{dayNum}</span>
            {hasItems && <span className="week-day-dot" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
