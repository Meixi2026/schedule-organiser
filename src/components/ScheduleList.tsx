import type { ScheduleItem } from '../types';

interface Props {
  items: ScheduleItem[];
  formatDateLabel: (date: string) => string;
  onToggleComplete: (id: string) => void;
  onToggleSubTaskComplete: (scheduleId: string, subTaskId: string) => void;
  onToggleReminder: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ScheduleList({
  items,
  formatDateLabel,
  onToggleComplete,
  onToggleSubTaskComplete,
  onToggleReminder,
  onDelete,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">☁</div>
        <p className="empty-state-text">
          还没有日程<br />
          随便说一个，我来帮你整理
        </p>
      </div>
    );
  }

  let lastDate = '';

  return (
    <div className="schedule-list">
      {items.map((item) => {
        const showDateHeader = item.date !== lastDate;
        lastDate = item.date;

        return (
          <div key={item.id}>
            {showDateHeader && (
              <div className="section-header" style={{ marginTop: 8 }}>
                <span className="section-title">{formatDateLabel(item.date)}</span>
              </div>
            )}
            <div
              className={[
                'schedule-item',
                item.needsReminder ? 'important' : '',
                item.isDeadline ? 'deadline' : '',
                item.completed ? 'completed' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="item-header">
                <button
                  className={`item-checkbox ${item.completed ? 'checked' : ''}`}
                  onClick={() => onToggleComplete(item.id)}
                >
                  {item.completed ? '✓' : ''}
                </button>

                <div className="item-body">
                  <div className={`item-title ${item.completed ? 'done' : ''}`}>
                    {item.title}
                  </div>
                  <div className="item-meta">
                    {item.time && <span className="meta-tag">{item.time}</span>}
                    {item.location && <span className="meta-tag">📍 {item.location}</span>}
                    <span className={`type-badge ${item.isDeadline ? 'ddl' : ''}`}>
                      {item.type}
                    </span>
                    {item.needsReminder && (
                      <span className="reminder-badge">● 提醒</span>
                    )}
                  </div>

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
                          <span>{st.date} {st.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="item-actions">
                  <button
                    className="item-action-btn"
                    onClick={() => onToggleReminder(item.id)}
                    title={item.needsReminder ? '取消提醒' : '设为提醒'}
                  >
                    {item.needsReminder ? '🔔' : '🔕'}
                  </button>
                  <button
                    className="item-action-btn"
                    onClick={() => onDelete(item.id)}
                    title="删除"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
