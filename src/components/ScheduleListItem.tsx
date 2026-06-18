import { useState } from 'react';
import {
  MapPin,
  Bell,
  BellOff,
  X,
  Check,
} from 'lucide-react';
import type { ScheduleItem } from '../types';
import {
  getTypeClass,
  getScheduleUrgency,
  formatTimeDisplay,
  formatSubtaskLine,
  getSubtaskProgress,
} from '../utils/scheduleDisplay';

interface Props {
  item: ScheduleItem;
  formatDateLabel: (date: string) => string;
  showTimelineConnector?: boolean;
  onToggleComplete: (id: string) => void;
  onToggleSubTaskComplete: (scheduleId: string, subTaskId: string) => void;
  onToggleReminder: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ScheduleListItem({
  item,
  formatDateLabel,
  showTimelineConnector,
  onToggleComplete,
  onToggleSubTaskComplete,
  onToggleReminder,
  onDelete,
}: Props) {
  const [removing, setRemoving] = useState(false);
  const urgency = getScheduleUrgency(item);
  const typeClass = getTypeClass(item.type);
  const progress = getSubtaskProgress(item.subTasks);
  const progressPct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  const classes = [
    'schedule-item',
    typeClass,
    item.isDeadline ? 'deadline' : '',
    item.completed ? 'completed' : '',
    urgency === 'overdue' ? 'overdue' : '',
    urgency === 'due-soon' ? 'due-soon' : '',
    item.needsReminder ? 'has-reminder' : '',
    showTimelineConnector ? 'has-connector' : '',
    removing ? 'removing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className="schedule-item-layout">
        <div className="schedule-time-col">
          <span className={`schedule-time ${urgency === 'overdue' && !item.completed ? 'urgent' : ''}`}>
            {formatTimeDisplay(item.time)}
          </span>
        </div>
        <div className="schedule-type-bar" aria-hidden="true" />
        <div className="schedule-item-main">
          <div className="item-header">
            <button
              type="button"
              className={`item-checkbox ${item.completed ? 'checked' : ''}`}
              onClick={() => onToggleComplete(item.id)}
              aria-label={item.completed ? '标记未完成' : '标记完成'}
            >
              {item.completed && <Check size={10} strokeWidth={3} />}
            </button>

            <div className="item-body selectable">
              <div className={`item-title ${item.completed ? 'done' : ''}`}>
                {item.title}
              </div>
              <div className="item-meta">
                {urgency === 'overdue' && !item.completed && (
                  <span className="status-badge overdue-badge">已过期</span>
                )}
                {urgency === 'due-soon' && !item.completed && (
                  <span className="status-badge due-soon-badge">临近</span>
                )}
                {item.location && (
                  <span className="meta-tag">
                    <MapPin size={11} strokeWidth={2} />
                    {item.location}
                  </span>
                )}
                <span className={`type-badge ${typeClass}`}>{item.type}</span>
                {item.needsReminder && (
                  <span className="reminder-badge">
                    <Bell size={10} strokeWidth={2.5} />
                    提醒
                  </span>
                )}
              </div>

              {progress.total > 0 && (
                <div className="subtask-progress">
                  <div className="subtask-progress-label">
                    子任务 {progress.done}/{progress.total}
                  </div>
                  <div className="subtask-progress-bar">
                    <div
                      className="subtask-progress-fill"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {item.subTasks && item.subTasks.length > 0 && (
                <div className="subtasks">
                  {item.subTasks.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      className={`subtask ${st.completed ? 'completed' : ''}`}
                      onClick={() => onToggleSubTaskComplete(item.id, st.id)}
                    >
                      <span className={`subtask-dot ${st.completed ? 'done' : ''}`} />
                      <span>
                        {formatSubtaskLine(
                          formatDateLabel(st.date),
                          st.title,
                          st.time,
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="item-actions">
              <button
                type="button"
                className={`item-action-btn ${item.needsReminder ? 'active' : ''}`}
                onClick={() => onToggleReminder(item.id)}
                title={item.needsReminder ? '取消提醒' : '设为提醒'}
              >
                {item.needsReminder ? (
                  <Bell size={14} strokeWidth={2} />
                ) : (
                  <BellOff size={14} strokeWidth={2} />
                )}
              </button>
              <button
                type="button"
                className="item-action-btn"
                onClick={() => {
                  setRemoving(true);
                  setTimeout(() => onDelete(item.id), 200);
                }}
                title="删除"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
