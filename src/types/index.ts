export type EventType =
  | '工作'
  | '学习'
  | '生活'
  | '社交'
  | '健康'
  | 'DDL'
  | '其他';

export interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  type: EventType;
  isDeadline: boolean;
  needsReminder: boolean;
  reminderTime?: string;
  subTasks?: SubTask[];
  notes?: string;
  createdAt: string;
  completed: boolean;
}

export interface SubTask {
  id: string;
  title: string;
  date: string;
  time?: string;
  completed: boolean;
}

export interface CompanionMessage {
  text: string;
  generatedAt: string;
  period: 'morning' | 'afternoon';
}

export interface AppData {
  schedules: ScheduleItem[];
  companionMessage?: CompanionMessage;
  apiKey?: string;
  isHidden: boolean;
  companionCollapsed?: boolean;
}

export interface ParsedInput {
  title: string;
  date: string;
  time?: string;
  location?: string;
  type: EventType;
  isDeadline: boolean;
  needsReminder: boolean;
  reminderTime?: string;
  subTasks?: Omit<SubTask, 'id' | 'completed'>[];
}

export interface ElectronAPI {
  getData: () => Promise<AppData>;
  saveData: (data: Partial<AppData>) => Promise<AppData>;
  toggleVisibility: () => Promise<boolean>;
  getVisibility: () => Promise<boolean>;
  showReminder: (text: string) => void;
  parseWithAI: (input: string, apiKey: string) => Promise<ParsedInput>;
  generateCompanion: (schedules: ScheduleItem[], apiKey: string) => Promise<string>;
  generateDDLPlan: (input: string, apiKey: string) => Promise<ParsedInput>;
  onVisibilityChange: (callback: (hidden: boolean) => void) => () => void;
  onReminderTriggered: (callback: (text: string) => void) => () => void;
  closeWindow: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
