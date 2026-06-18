import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ScheduleItem, AppData, CompanionMessage, ParsedInput } from './types';
import TitleBar from './components/TitleBar';
import CompanionCard from './components/CompanionCard';
import ScheduleInput from './components/ScheduleInput';
import ScheduleList from './components/ScheduleList';
import SettingsModal from './components/SettingsModal';
import WeekStrip from './components/WeekStrip';

type FilterTab = 'all' | 'today' | 'reminder' | 'ddl';

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return '今天';
  if (isTomorrow(date)) return '明天';
  return format(date, 'M月d日 EEEE', { locale: zhCN });
}

function getCurrentPeriod(): 'morning' | 'afternoon' {
  return new Date().getHours() < 12 ? 'morning' : 'afternoon';
}

function shouldRegenerateCompanion(msg?: CompanionMessage): boolean {
  if (!msg) return true;
  const now = new Date();
  const generated = new Date(msg.generatedAt);
  const currentPeriod = getCurrentPeriod();
  if (msg.period !== currentPeriod) return true;
  const hoursSince = (now.getTime() - generated.getTime()) / 3600000;
  return hoursSince >= 6;
}

export default function App() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [companionMessage, setCompanionMessage] = useState<CompanionMessage | undefined>();
  const [apiKey, setApiKey] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [companionCollapsed, setCompanionCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  useEffect(() => {
    async function load() {
      if (!isElectron) {
        setLoading(false);
        return;
      }
      const data: AppData = await window.electronAPI.getData();
      setSchedules(data.schedules || []);
      setCompanionMessage(data.companionMessage);
      setApiKey(data.apiKey || '');
      setIsHidden(data.isHidden || false);
      setCompanionCollapsed(data.companionCollapsed ?? false);
      setLoading(false);

      if (shouldRegenerateCompanion(data.companionMessage)) {
        regenerateCompanion(data.schedules || [], data.apiKey || '');
      }
    }
    load();
  }, [isElectron]);

  useEffect(() => {
    if (!isElectron) return;
    const unsub1 = window.electronAPI.onVisibilityChange(setIsHidden);
    const unsub2 = window.electronAPI.onReminderTriggered(() => {});
    return () => { unsub1(); unsub2(); };
  }, [isElectron]);

  useEffect(() => {
    if (!isElectron) return;
    const interval = setInterval(() => {
      if (shouldRegenerateCompanion(companionMessage)) {
        regenerateCompanion(schedules, apiKey);
      }
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isElectron, schedules, apiKey, companionMessage]);

  const save = useCallback(async (partial: Partial<AppData>) => {
    if (!isElectron) return;
    const updated = await window.electronAPI.saveData(partial);
    if (updated.schedules) setSchedules(updated.schedules);
    if (updated.companionMessage) setCompanionMessage(updated.companionMessage);
    if (updated.apiKey !== undefined) setApiKey(updated.apiKey);
    if (updated.companionCollapsed !== undefined) setCompanionCollapsed(updated.companionCollapsed);
  }, [isElectron]);

  const regenerateCompanion = async (items: ScheduleItem[], key: string) => {
    if (!isElectron) return;
    try {
      const text = await window.electronAPI.generateCompanion(items, key);
      const msg: CompanionMessage = {
        text,
        generatedAt: new Date().toISOString(),
        period: getCurrentPeriod(),
      };
      setCompanionMessage(msg);
      await save({ companionMessage: msg });
    } catch {
      /* keep existing message */
    }
  };

  const addFromParsed = async (parsed: ParsedInput) => {
    const item: ScheduleItem = {
      id: uuidv4(),
      title: parsed.title,
      date: parsed.date,
      time: parsed.time,
      location: parsed.location,
      type: parsed.type,
      isDeadline: parsed.isDeadline,
      needsReminder: parsed.needsReminder,
      reminderTime: parsed.reminderTime,
      subTasks: parsed.subTasks?.map((st) => ({
        ...st,
        id: uuidv4(),
        completed: false,
      })),
      createdAt: new Date().toISOString(),
      completed: false,
    };
    const updated = [item, ...schedules];
    setSchedules(updated);
    await save({ schedules: updated });
    regenerateCompanion(updated, apiKey);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async (input: string, isDDL: boolean) => {
    if (!input.trim() || !isElectron) return;
    setAdding(true);
    try {
      const parsed = isDDL
        ? await window.electronAPI.generateDDLPlan(input, apiKey)
        : await window.electronAPI.parseWithAI(input, apiKey);
      await addFromParsed(parsed);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '添加失败，请重试');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleComplete = async (id: string) => {
    const updated = schedules.map((s) =>
      s.id === id ? { ...s, completed: !s.completed } : s,
    );
    setSchedules(updated);
    await save({ schedules: updated });
  };

  const handleToggleSubTaskComplete = async (scheduleId: string, subTaskId: string) => {
    const updated = schedules.map((s) => {
      if (s.id !== scheduleId || !s.subTasks) return s;
      return {
        ...s,
        subTasks: s.subTasks.map((st) =>
          st.id === subTaskId ? { ...st, completed: !st.completed } : st,
        ),
      };
    });
    setSchedules(updated);
    await save({ schedules: updated });
  };

  const handleToggleReminder = async (id: string) => {
    const updated = schedules.map((s) =>
      s.id === id ? { ...s, needsReminder: !s.needsReminder } : s,
    );
    setSchedules(updated);
    await save({ schedules: updated });
  };

  const handleDelete = async (id: string) => {
    const updated = schedules.filter((s) => s.id !== id);
    setSchedules(updated);
    await save({ schedules: updated });
  };

  const handleSaveApiKey = async (key: string) => {
    setApiKey(key);
    await save({ apiKey: key });
  };

  const handleToggleCompanionCollapse = async () => {
    const next = !companionCollapsed;
    setCompanionCollapsed(next);
    await save({ companionCollapsed: next });
  };

  const handleWeekSelect = (dateStr: string) => {
    setDateFilter((prev) => (prev === dateStr ? null : dateStr));
    if (dateFilter !== dateStr) setFilter('all');
  };

  const filterCounts = {
    all: schedules.filter((s) => !s.completed).length,
    today: schedules.filter((s) => !s.completed && isToday(parseISO(s.date))).length,
    reminder: schedules.filter((s) => !s.completed && s.needsReminder).length,
    ddl: schedules.filter((s) => !s.completed && s.isDeadline).length,
  };

  const filtered = schedules.filter((s) => {
    if (s.completed) return false;
    if (dateFilter && s.date !== dateFilter) return false;
    if (filter === 'today') return isToday(parseISO(s.date));
    if (filter === 'reminder') return s.needsReminder;
    if (filter === 'ddl') return s.isDeadline;
    return true;
  });

  const completedItems = schedules.filter((s) => s.completed);

  const sorted = [...filtered].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.time || '').localeCompare(b.time || '');
  });

  const sortedCompleted = [...completedItems].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.time || '').localeCompare(b.time || '');
  });

  if (loading) {
    return (
      <div className="app">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <TitleBar
        isHidden={isHidden}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="content">
        <WeekStrip
          schedules={schedules}
          selectedDate={dateFilter}
          onSelectDate={handleWeekSelect}
        />

        {companionMessage && (
          <CompanionCard
            message={companionMessage.text}
            companionMeta={companionMessage}
            collapsed={companionCollapsed}
            onToggleCollapse={handleToggleCompanionCollapse}
          />
        )}

        <ScheduleInput onAdd={handleAdd} adding={adding} />

        <div className="filter-tabs">
          {([
            ['all', '全部'],
            ['today', '今天'],
            ['reminder', '提醒'],
            ['ddl', 'DDL'],
          ] as [FilterTab, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`filter-tab ${filter === key ? 'active' : ''}`}
              onClick={() => {
                setFilter(key);
                setDateFilter(null);
              }}
            >
              {label}
              {filterCounts[key] > 0 && (
                <span className="filter-tab-count">{filterCounts[key]}</span>
              )}
            </button>
          ))}
        </div>

        <ScheduleList
          items={sorted}
          completedItems={sortedCompleted}
          formatDateLabel={formatDateLabel}
          onToggleComplete={handleToggleComplete}
          onToggleSubTaskComplete={handleToggleSubTaskComplete}
          onToggleReminder={handleToggleReminder}
          onDelete={handleDelete}
          onExampleClick={(text) => handleAdd(text, false)}
        />
      </div>

      {showSettings && (
        <SettingsModal
          apiKey={apiKey}
          onSave={handleSaveApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export { formatDateLabel };
