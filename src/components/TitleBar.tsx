interface Props {
  isHidden: boolean;
  onToggleSettings: () => void;
}

export default function TitleBar({ isHidden, onToggleSettings }: Props) {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  const handleClose = () => {
    if (isElectron) window.electronAPI.closeWindow();
  };

  const handleToggleVisibility = async () => {
    if (isElectron) await window.electronAPI.toggleVisibility();
  };

  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <button className="traffic-light close" onClick={handleClose} title={isElectron ? '关闭' : '隐藏到托盘'} />
        <button className="traffic-light hide" onClick={handleToggleVisibility} title={isHidden ? '显示窗口' : '隐藏窗口'} />
      </div>
      <span className="titlebar-title">日程</span>
      <div className="titlebar-actions">
        <button className="icon-btn" onClick={onToggleSettings} title="设置">
          ⚙
        </button>
      </div>
    </div>
  );
}
