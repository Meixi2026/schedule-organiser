import { contextBridge, ipcRenderer } from 'electron';
import type { AppData, ScheduleItem, ParsedInput } from '../src/types';

contextBridge.exposeInMainWorld('electronAPI', {
  getData: (): Promise<AppData> => ipcRenderer.invoke('get-data'),
  saveData: (data: Partial<AppData>): Promise<AppData> =>
    ipcRenderer.invoke('save-data', data),
  toggleVisibility: (): Promise<boolean> => ipcRenderer.invoke('toggle-visibility'),
  getVisibility: (): Promise<boolean> => ipcRenderer.invoke('get-visibility'),
  showReminder: (text: string): void => ipcRenderer.send('show-reminder', text),
  parseWithAI: (input: string, apiKey: string): Promise<ParsedInput> =>
    ipcRenderer.invoke('parse-with-ai', input, apiKey),
  generateCompanion: (schedules: ScheduleItem[], apiKey: string): Promise<string> =>
    ipcRenderer.invoke('generate-companion', schedules, apiKey),
  generateDDLPlan: (input: string, apiKey: string): Promise<ParsedInput> =>
    ipcRenderer.invoke('generate-ddl-plan', input, apiKey),
  onVisibilityChange: (callback: (hidden: boolean) => void) => {
    const handler = (_: unknown, hidden: boolean) => callback(hidden);
    ipcRenderer.on('visibility-changed', handler);
    return () => ipcRenderer.removeListener('visibility-changed', handler);
  },
  onReminderTriggered: (callback: (text: string) => void) => {
    const handler = (_: unknown, text: string) => callback(text);
    ipcRenderer.on('reminder-triggered', handler);
    return () => ipcRenderer.removeListener('reminder-triggered', handler);
  },
  closeWindow: (): void => ipcRenderer.send('window-close'),
  quitApp: (): void => ipcRenderer.send('window-quit'),
});
