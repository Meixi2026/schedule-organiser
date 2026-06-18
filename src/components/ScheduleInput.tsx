import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Mic, Loader2 } from 'lucide-react';

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
  onExampleClick?: (text: string) => void;
}

const SCHEDULE_EXAMPLE = '明天下午3点在公司开会，记得提醒';
const DDL_EXAMPLE = '论文 6月15日 截止，记得提醒';

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

  const applyExample = () => {
    setInput(mode === 'ddl' ? DDL_EXAMPLE : SCHEDULE_EXAMPLE);
  };

  return (
    <div className="input-section">
      <div className="input-mode-tabs">
        <button
          type="button"
          className={`input-mode-tab ${mode === 'schedule' ? 'active' : ''}`}
          onClick={() => setMode('schedule')}
        >
          日程
        </button>
        <button
          type="button"
          className={`input-mode-tab ddl ${mode === 'ddl' ? 'active' : ''}`}
          onClick={() => setMode('ddl')}
        >
          DDL 规划
        </button>
      </div>

      <div className="input-wrapper">
        {voiceSupported && (
          <button
            type="button"
            className={`voice-btn ${listening ? 'listening' : ''}`}
            onClick={toggleVoice}
            disabled={adding}
            title={listening ? '停止语音输入' : '语音输入'}
          >
            <Mic size={16} strokeWidth={2} />
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
          type="button"
          className="add-btn"
          onClick={handleSubmit}
          disabled={!input.trim() || adding}
        >
          {adding ? (
            <Loader2 size={14} className="spin" strokeWidth={2.5} />
          ) : mode === 'ddl' ? (
            '规划'
          ) : (
            '添加'
          )}
        </button>
      </div>
      <div className="input-hints">
        <span className="hint-tag">说「提醒」= 重要事项</span>
        <button type="button" className="hint-tag hint-example" onClick={applyExample}>
          试试示例
        </button>
      </div>
    </div>
  );
}
