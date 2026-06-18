import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CompanionMessage } from '../types';

interface Props {
  message: string;
  companionMeta?: CompanionMessage;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function getPeriodGradient(period?: CompanionMessage['period']): string {
  if (period === 'morning') {
    return 'companion-card companion-morning';
  }
  return 'companion-card companion-afternoon';
}

export default function CompanionCard({
  message,
  companionMeta,
  collapsed,
  onToggleCollapse,
}: Props) {
  const cardClass = getPeriodGradient(companionMeta?.period);

  if (collapsed) {
    return (
      <button
        type="button"
        className="companion-collapsed-bar"
        onClick={onToggleCollapse}
      >
        <span className="companion-label-inline">今日一句</span>
        <ChevronDown size={14} strokeWidth={2} />
      </button>
    );
  }

  return (
    <div className={cardClass}>
      <div className="companion-header">
        <div className="companion-label">今日一句</div>
        <button
          type="button"
          className="companion-collapse-btn"
          onClick={onToggleCollapse}
          title="收起"
        >
          <ChevronUp size={14} strokeWidth={2} />
        </button>
      </div>
      <p className="companion-text selectable">{message}</p>
    </div>
  );
}
