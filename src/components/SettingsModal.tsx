import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  apiKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export default function SettingsModal({ apiKey, onSave, onClose }: Props) {
  const [key, setKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">设置</h2>
          <button type="button" className="icon-btn" onClick={onClose} title="关闭">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="settings-label">DeepSeek API Key</div>
        <input
          className="settings-input"
          type="password"
          placeholder="sk-..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <p className="settings-hint">
          用于智能解析日程、DDL 规划和陪伴话语。不填也能用基础功能。
        </p>
        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            取消
          </button>
          <button type="button" className="add-btn" onClick={handleSave}>
            {saved ? '已保存' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
