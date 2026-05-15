import { HitomemoData, todayString, nowString } from './types';
import { formatDateTime, sortConversations } from './storage';

function escapeMd(value: string) {
  return value.trim() || '（未入力）';
}

function conversationMemoText(feelingNote: string, memo: string) {
  return [feelingNote, memo].filter((value) => value.trim()).join('\n') || '（未入力）';
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function jsonBackupName() {
  return `hitomemo-backup-${todayString()}.json`;
}

export function markdownExportName() {
  return `hitomemo-export-${todayString()}.md`;
}

export function buildMarkdown(data: HitomemoData) {
  const lines: string[] = [
    '# ひとめも エクスポート', '',
    `- 出力日時：${formatDateTime(nowString())}`,
    `- 人メモ件数：${data.people.length}`,
    `- 会話メモ件数：${data.conversations.length}`, '',
    '## 注意', '',
    'このMarkdownには人に関するメモが含まれます。',
    '本名・住所・電話番号・メールアドレス・顔写真など、相手を強く特定できる情報は登録しない方針です。',
    'AIに読ませる場合も、必要に応じて内容を伏せてください。', '', '---', '',
  ];

  data.people.forEach((person) => {
    const conversations = sortConversations(data.conversations.filter((item) => item.personId === person.id));
    lines.push(`## ${escapeMd(person.nickname)}`, '', '### 基本');
    lines.push(`- 関係：${escapeMd(person.relation)}`, `- 年齢：${escapeMd(person.ageNote)}`, `- 性別：${escapeMd(person.genderNote)}`, `- 身長：${escapeMd(person.heightNote)}`, `- 職業：${escapeMd(person.jobNote)}`, `- MBTI：${escapeMd(person.mbtiNote)}`, '', '### 会話のための特徴');
    lines.push(`- 見た目・雰囲気：${escapeMd(person.appearanceNote)}`, `- 性格：${escapeMd(person.personalityNote)}`, `- 好きなこと：${escapeMd(person.likesNote)}`, `- 苦手・嫌いなもの：${escapeMd(person.dislikesNote)}`, `- その人らしさメモ：${escapeMd(person.uniquenessNote)}`, '', '### 会う前のメモ');
    lines.push(`- 覚えておきたいこと：${escapeMd(person.rememberNote)}`, `- 次に話したいこと：${escapeMd(person.nextTalkNote)}`, `- 自分が感じていること：${escapeMd(person.feelingNote)}`, `- 自由メモ：${escapeMd(person.memo)}`, '', '### 会話メモ', '');
    if (conversations.length === 0) lines.push('（会話メモなし）', '');
    conversations.forEach((conversation) => {
      lines.push(`#### ${escapeMd(conversation.metDate)}`);
      lines.push(`- 場所・場面：${escapeMd(conversation.placeNote)}`, `- 話したこと：${escapeMd(conversation.talkedAbout)}`, `- 感じたこと・メモ：${conversationMemoText(conversation.feelingNote, conversation.memo)}`, '');
    });
    lines.push('---', '');
  });

  return lines.join('\n');
}


