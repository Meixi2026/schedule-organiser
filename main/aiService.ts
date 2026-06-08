import type { ParsedInput, ScheduleItem, EventType } from '../src/types';

const EVENT_TYPES: EventType[] = ['工作', '学习', '生活', '社交', '健康', 'DDL', '其他'];

async function callDeepSeek(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI 请求失败: ${response.status} ${err}`);
  }

  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
}

function localDateStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function today(): string {
  return localDateStr();
}

function parseDateFromText(text: string): string {
  const now = new Date();
  if (/今天|今日/.test(text)) return today();
  if (/明天|明日/.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return localDateStr(d);
  }
  if (/后天/.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return localDateStr(d);
  }
  const match = text.match(/(\d{1,2})月(\d{1,2})[日号]?/);
  if (match) {
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const year = now.getFullYear();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  return today();
}

function parseTimeFromText(text: string): string | undefined {
  const match = text.match(/(\d{1,2})[:：](\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  const hourMatch = text.match(/(\d{1,2})[点时]/);
  if (hourMatch) return `${hourMatch[1].padStart(2, '0')}:00`;
  return undefined;
}

function parseTypeFromText(text: string): EventType {
  if (/DDL|截止|deadline|交|提交|due/i.test(text)) return 'DDL';
  if (/工作|会议|项目|上班|加班/.test(text)) return '工作';
  if (/学习|考试|复习|作业|论文/.test(text)) return '学习';
  if (/健身|运动|医院|体检|健康/.test(text)) return '健康';
  if (/聚会|朋友|约会|社交/.test(text)) return '社交';
  if (/买|吃|家|生活/.test(text)) return '生活';
  return '其他';
}

function parseLocationFromText(text: string): string | undefined {
  const match = text.match(/在(.{2,10}?)(?:进行|开|做|见面|见|$)/);
  if (match) return match[1].trim();
  const atMatch = text.match(/@(.{2,15})/);
  if (atMatch) return atMatch[1].trim();
  return undefined;
}

function needsReminderFromText(text: string): boolean {
  return /提醒|记得|别忘了|重要|务必|一定|特别/.test(text);
}

function localParse(input: string): ParsedInput {
  const isDeadline = /DDL|截止|deadline|交|提交|due/i.test(input);
  return {
    title: input.replace(/提醒|记得|别忘了|重要|务必|一定|特别/g, '').trim(),
    date: parseDateFromText(input),
    time: parseTimeFromText(input),
    location: parseLocationFromText(input),
    type: parseTypeFromText(input),
    isDeadline,
    needsReminder: needsReminderFromText(input),
    reminderTime: parseTimeFromText(input),
  };
}

export async function parseWithAI(input: string, apiKey: string): Promise<ParsedInput> {
  if (!apiKey) return localParse(input);

  const systemPrompt = `你是日程解析助手。将用户的自然语言输入解析为 JSON，字段如下：
{
  "title": "简洁标题",
  "date": "YYYY-MM-DD",
  "time": "HH:MM 或 null",
  "location": "地点或 null",
  "type": "${EVENT_TYPES.join('|')}",
  "isDeadline": false,
  "needsReminder": false,
  "reminderTime": "HH:MM 或 null"
}
规则：
- 今天是 ${today()}
- needsReminder 为 true 当用户说"提醒"、"记得"、"重要"、"务必"等
- isDeadline 为 true 当用户提到 DDL、截止、提交等
- 只返回 JSON，不要其他文字`;

  try {
    const result = await callDeepSeek(apiKey, systemPrompt, input);
    const parsed = JSON.parse(result);
    return {
      title: parsed.title || input,
      date: parsed.date || today(),
      time: parsed.time || undefined,
      location: parsed.location || undefined,
      type: EVENT_TYPES.includes(parsed.type) ? parsed.type : '其他',
      isDeadline: !!parsed.isDeadline,
      needsReminder: !!parsed.needsReminder,
      reminderTime: parsed.reminderTime || parsed.time || undefined,
    };
  } catch {
    return localParse(input);
  }
}

export async function generateDDLPlan(input: string, apiKey: string): Promise<ParsedInput> {
  const base = await parseWithAI(input, apiKey);

  if (!apiKey) {
    const deadline = new Date(base.date);
    const subTasks = [];
    for (let i = 3; i >= 1; i--) {
      const d = new Date(deadline);
      d.setDate(d.getDate() - i);
      subTasks.push({
        title: i === 1 ? '最终检查与提交' : i === 2 ? '完善与修改' : '开始准备',
        date: d.toISOString().split('T')[0],
      });
    }
    return { ...base, isDeadline: true, type: 'DDL', subTasks };
  }

  const systemPrompt = `你是日程规划助手。用户有一个 DDL 任务，请生成完成计划。
返回 JSON：
{
  "title": "任务标题",
  "date": "DDL日期 YYYY-MM-DD",
  "time": "HH:MM 或 null",
  "location": "地点或 null",
  "type": "DDL",
  "isDeadline": true,
  "needsReminder": true,
  "reminderTime": "HH:MM 或 null",
  "subTasks": [{"title": "步骤", "date": "YYYY-MM-DD", "time": "HH:MM 或 null"}]
}
今天是 ${today()}。subTasks 应从今天到 DDL 日合理分配 3-5 个步骤。只返回 JSON。`;

  try {
    const result = await callDeepSeek(apiKey, systemPrompt, input);
    const parsed = JSON.parse(result);
    return {
      title: parsed.title || base.title,
      date: parsed.date || base.date,
      time: parsed.time || base.time,
      location: parsed.location || base.location,
      type: 'DDL',
      isDeadline: true,
      needsReminder: true,
      reminderTime: parsed.reminderTime || parsed.time,
      subTasks: parsed.subTasks || [],
    };
  } catch {
    const deadline = new Date(base.date);
    const subTasks = [];
    for (let i = 3; i >= 1; i--) {
      const d = new Date(deadline);
      d.setDate(d.getDate() - i);
      subTasks.push({
        title: i === 1 ? '最终检查与提交' : i === 2 ? '完善与修改' : '开始准备',
        date: d.toISOString().split('T')[0],
      });
    }
    return { ...base, isDeadline: true, type: 'DDL', needsReminder: true, subTasks };
  }
}

export async function generateCompanion(
  schedules: ScheduleItem[],
  apiKey: string,
): Promise<string> {
  const upcoming = schedules
    .filter((s) => !s.completed)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
    .slice(0, 10)
    .map((s) => `${s.date} ${s.title}(${s.type})${s.needsReminder ? '[重要]' : ''}`)
    .join('\n');

  const fallbackMessages = [
    '今天也要好好照顾自己，一件一件来，你已经做得很好了。',
    '忙碌的日子里，别忘了给自己留一点呼吸的空间。',
    '无论日程多满，你都在认真生活，这本身就很了不起。',
    '慢慢来，不着急。每一步都算数。',
  ];

  if (!apiKey) {
    return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  }

  const systemPrompt = `你是一位温柔陪伴的朋友。根据用户的日程，写一句简短（30字以内）的安慰或鼓励。
语气：简约、温暖、不鸡汤、像苹果广告文案那样有质感。
只返回一句话，不要引号，不要其他内容。`;

  const userPrompt = upcoming
    ? `用户近期日程：\n${upcoming}`
    : '用户暂无日程，给一句日常陪伴。';

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 80,
      }),
    });

    if (!response.ok) throw new Error('API error');
    const data = (await response.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0].message.content.trim();
  } catch {
    return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  }
}
