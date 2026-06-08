import { useState } from 'react';

interface Props {
  apiKey: string;
  onSave: (key: string) => void;
}

export default function SettingsPanel({ apiKey, onSave }: Props) {
  const [key, setKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-panel">
      <div className="settings-label">DeepSeek API Key</div>
      <input
        className="settings-input"
        type="password"
        placeholder="sk-..."
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span className="settings-hint">
          用于智能解析日程、DDL 规划和陪伴话语。不填也能用基础功能。
        </span>
        <button className="add-btn" onClick={handleSave} style={{ padding: '6px 12px', fontSize: 12 }}>
          {saved ? '已保存' : '保存'}
        </button>
      </div>
    </div>
  );
}
