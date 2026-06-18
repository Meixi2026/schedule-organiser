import { useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import type { ScheduleItem } from '../types';
import ScheduleListItem from './ScheduleListItem';

interface Props {
  items: ScheduleItem[];
  completedItems: ScheduleItem[];
  formatDateLabel: (date: string) => string;
  onToggleComplete: (id: string) => void;
  onToggleSubTaskComplete: (scheduleId: string, subTaskId: string) => void;
  onToggleReminder: (id: string) => void;
  onDelete: (id: string) => void;
  onExampleClick?: (text: string) => void;
}

export default function ScheduleList({
  items,
  completedItems,
  formatDateLabel,
  onToggleComplete,
  onToggleSubTaskComplete,
  onToggleReminder,
  onDelete,
  onExampleClick,
}: Props) {
  const [completedOpen, setCompletedOpen] = useState(false);

  if (items.length === 0 && completedItems.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon" aria-hidden="true">
          <CalendarDays size={36} strokeWidth={1.5} />
        </div>
        <p className="empty-state-text">
          还没有日程
          <br />
          随便说一个，我来帮你整理
        </p>
        {onExampleClick && (
          <button
            type="button"
            className="empty-state-example"
            onClick={() => onExampleClick('明天下午3点在公司开会，记得提醒')}
          >
            明天下午3点在公司开会，记得提醒
          </button>
        )}
      </div>
    );
  }

  let lastDate = '';

  return (
    <div className="schedule-list">
      {items.map((item, index) => {
        const showDateHeader = item.date !== lastDate;
        lastDate = item.date;
        const nextItem = items[index + 1];
        const showConnector =
          item.time &&
          nextItem &&
          nextItem.date === item.date &&
          nextItem.time;

        return (
          <div key={item.id} className="schedule-group">
            {showDateHeader && (
              <div className="section-header sticky-header">
                <span className="section-title">{formatDateLabel(item.date)}</span>
                <span className="section-count">
                  {items.filter((i) => i.date === item.date).length} 项
                </span>
              </div>
            )}
            <ScheduleListItem
              item={item}
              formatDateLabel={formatDateLabel}
              showTimelineConnector={!!showConnector}
              onToggleComplete={onToggleComplete}
              onToggleSubTaskComplete={onToggleSubTaskComplete}
              onToggleReminder={onToggleReminder}
              onDelete={onDelete}
            />
          </div>
        );
      })}

      {completedItems.length > 0 && (
        <div className="completed-section">
          <button
            type="button"
            className="completed-section-toggle"
            onClick={() => setCompletedOpen(!completedOpen)}
          >
            <span>已完成 · {completedItems.length}</span>
            {completedOpen ? (
              <ChevronUp size={14} strokeWidth={2} />
            ) : (
              <ChevronDown size={14} strokeWidth={2} />
            )}
          </button>
          {completedOpen && (
            <div className="completed-list">
              {completedItems.map((item) => (
                <ScheduleListItem
                  key={item.id}
                  item={item}
                  formatDateLabel={formatDateLabel}
                  onToggleComplete={onToggleComplete}
                  onToggleSubTaskComplete={onToggleSubTaskComplete}
                  onToggleReminder={onToggleReminder}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
