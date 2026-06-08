import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface Props {
  onAdd: (input: string, isDDL: boolean) => void;
  adding: boolean;
}

export default function ScheduleInput({ onAdd, adding }: Props) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'schedule' | 'ddl'>('schedule');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current || adding) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const voiceSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const handleSubmit = () => {
    if (!input.trim() || adding) return;
    onAdd(input.trim(), mode === 'ddl');
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="input-section">
      <div className="input-wrapper">
        {voiceSupported && (
          <button
            className={`voice-btn ${listening ? 'listening' : ''}`}
            onClick={toggleVoice}
            disabled={adding}
            title={listening ? '停止语音输入' : '语音输入'}
            type="button"
          >
            {listening ? '●' : '🎤'}
          </button>
        )}
        <textarea
          className="schedule-input"
          placeholder={
            mode === 'ddl'
              ? '说出你的 DDL，例如：论文 6月15日 截止，记得提醒'
              : '随便说出一个安排，例如：明天下午3点在公司开会，记得提醒'
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="add-btn"
          onClick={handleSubmit}
          disabled={!input.trim() || adding}
        >
          {adding ? '...' : mode === 'ddl' ? '规划' : '添加'}
        </button>
      </div>
      <div className="input-hints">
        <button
          className={`hint-tag ${mode === 'schedule' ? 'active' : ''}`}
          onClick={() => setMode('schedule')}
          style={mode === 'schedule' ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : {}}
        >
          日程
        </button>
        <button
          className={`hint-tag ${mode === 'ddl' ? 'active' : ''}`}
          onClick={() => setMode('ddl')}
          style={mode === 'ddl' ? { background: 'var(--warm-soft)', color: 'var(--warm)' } : {}}
        >
          DDL 规划
        </button>
        <span className="hint-tag">说「提醒」= 重要事项</span>
      </div>
    </div>
  );
}
