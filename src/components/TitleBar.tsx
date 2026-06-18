import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Settings } from 'lucide-react';

interface Props {
  isHidden: boolean;
  onOpenSettings: () => void;
}

export default function TitleBar({ isHidden, onOpenSettings }: Props) {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  const todayLabel = format(new Date(), 'M月d日 EEEE', { locale: zhCN });

  const handleClose = () => {
    if (isElectron) window.electronAPI.closeWindow();
  };

  const handleToggleVisibility = async () => {
    if (isElectron) await window.electronAPI.toggleVisibility();
  };

  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <button
          type="button"
          className="traffic-light close"
          onClick={handleClose}
          title={isElectron ? '关闭' : '隐藏到托盘'}
        />
        <button
          type="button"
          className="traffic-light hide"
          onClick={handleToggleVisibility}
          title={isHidden ? '显示窗口' : '隐藏窗口'}
        />
      </div>
      <div className="titlebar-center">
        <span className="titlebar-title">日程</span>
        <span className="titlebar-date">{todayLabel}</span>
      </div>
      <div className="titlebar-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenSettings}
          title="设置"
        >
          <Settings size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
