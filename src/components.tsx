import React from 'react';
import { Conversation, Person } from './types';

export function PrivacyNote() {
  return <section className="notice strong"><p>ひとめもは、会話を思い出すための軽いメモアプリです。</p><p>本名・住所・電話番号・メールアドレス・顔写真など、相手を強く特定できる情報は登録しないでください。</p><p>呼び名、関係、性格、好きなこと、苦手なもの、前に話したこと、次に話したいことなど、会話を思い出すための情報だけを残す使い方を想定しています。</p></section>;
}

type TextareaSize = 'compact' | 'medium' | 'long';
type PersonTextKey = keyof Pick<Person, 'ageNote' | 'genderNote' | 'heightNote' | 'jobNote' | 'mbtiNote'>;

const ageOptions = ['不明', '10代', '20代前半', '20代後半', '30代前半', '30代後半', '40代', '50代以上'];
const genderOptions = ['不明', '女性', '男性', 'その他', '書かない'];
const jobOptions = ['不明', '会社員', '学生', '自営業', 'フリーランス', '公務員', '医療・福祉', '接客・販売', 'クリエイター'];
const mbtiOptions = ['不明', 'INFP', 'ENFP', 'INFJ', 'ENFJ', 'INTJ', 'ENTJ', 'INTP', 'ENTP', 'ISFP', 'ESFP', 'ISFJ', 'ESFJ', 'ISTP', 'ESTP', 'ISTJ', 'ESTJ'];

function withCurrentOption(options: string[], value: string) {
  return value && !options.includes(value) ? [...options, value] : options;
}

function heightDisplay(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '未設定';
  if (/^\d+$/.test(trimmed)) return `${trimmed}cm`;
  return trimmed;
}

function textareaRows(value: string, size: TextareaSize) {
  const lineCount = Math.max(1, value.split('\n').length);
  if (size === 'compact') return value.trim() ? Math.min(3, lineCount) : 1;
  if (size === 'medium') return Math.max(3, Math.min(5, lineCount));
  return Math.max(4, Math.min(7, lineCount));
}

export function Field({ label, value, onChange, multiline, type = 'text', required, hint, textareaSize = 'long' }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; type?: string; required?: boolean; hint?: string; textareaSize?: TextareaSize }) {
  const id = label.replace(/\s/g, '-');
  return <label className="field" htmlFor={id}><span>{label}{required && <b> 必須</b>}</span>{hint && <small>{hint}</small>}{multiline ? <textarea className={`textarea-${textareaSize}`} id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={textareaRows(value, textareaSize)} /> : <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />}</label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const selectable = withCurrentOption(options, value);
  return <label className="field" htmlFor={label}><span>{label}</span><select id={label} value={value} onChange={(event) => onChange(event.target.value)}><option value="">未設定</option>{selectable.map((option) => <option key={option} value={option}>{options.includes(option) ? option : `${option}（現在の値）`}</option>)}</select></label>;
}

function HeightField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="field" htmlFor="身長"><span>身長</span><input id="身長" type="text" inputMode="numeric" pattern="[0-9]*" value={value} placeholder="例：162" onChange={(event) => onChange(event.target.value)} /><small>数字だけ入れると、表示時は cm を付けます。既存の文字列もそのまま残せます。</small></label>;
}

function JobField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = value && !jobOptions.includes(value) ? 'その他' : value;
  const customValue = selected === 'その他' && value !== 'その他' ? value : '';
  return <div className="job-field"><label className="field" htmlFor="職業"><span>職業</span><select id="職業" value={selected} onChange={(event) => onChange(event.target.value === 'その他' ? customValue || 'その他' : event.target.value)}><option value="">未設定</option>{jobOptions.map((option) => <option key={option} value={option}>{option}</option>)}<option value="その他">その他</option></select></label>{selected === 'その他' && <Field label="その他の職業メモ" value={customValue} onChange={onChange} />}</div>;
}

export function BasicAttributeFields({ values, onChange }: { values: Pick<Person, PersonTextKey>; onChange: (key: PersonTextKey, value: string) => void }) {
  return <div className="two-column-fields"><SelectField label="年齢" value={values.ageNote} options={ageOptions} onChange={(value) => onChange('ageNote', value)} /><SelectField label="性別" value={values.genderNote} options={genderOptions} onChange={(value) => onChange('genderNote', value)} /><HeightField value={values.heightNote} onChange={(value) => onChange('heightNote', value)} /><JobField value={values.jobNote} onChange={(value) => onChange('jobNote', value)} /><SelectField label="MBTI" value={values.mbtiNote} options={mbtiOptions} onChange={(value) => onChange('mbtiNote', value)} /></div>;
}

function MemoRows({ rows }: { rows: [string, string][] }) {
  return <dl className="memo-list">{rows.map(([label, value]) => <React.Fragment key={label}><dt>{label}</dt><dd>{value || '（未入力）'}</dd></React.Fragment>)}</dl>;
}

export function BasicMemoSummary({ person }: { person: Person }) {
  const profileItems: [string, string][] = [['年齢', person.ageNote], ['性別', person.genderNote], ['身長', heightDisplay(person.heightNote)], ['職業', person.jobNote], ['MBTI', person.mbtiNote]];
  const basicRows: [string, string][] = [['呼び名', person.nickname], ['関係', person.relation]];
  const featureRows: [string, string][] = [['見た目・雰囲気', person.appearanceNote], ['性格', person.personalityNote], ['好きなこと', person.likesNote], ['苦手・嫌いなもの', person.dislikesNote], ['その人らしさメモ', person.uniquenessNote]];
  return <div className="basic-memo-summary"><MemoRows rows={basicRows} /><div className="profile-grid" aria-label="基本属性">{profileItems.map(([label, value]) => <div className="profile-chip" key={label}><span>{label}</span><strong>{value || '未設定'}</strong></div>)}</div><MemoRows rows={featureRows} /></div>;
}

export function MeetBeforeMemoSummary({ person }: { person: Person }) {
  const rows: [string, string][] = [['覚えておきたいこと', person.rememberNote], ['次に話したいこと', person.nextTalkNote], ['自分が感じていること', person.feelingNote], ['自由メモ', person.memo]];
  return <MemoRows rows={rows} />;
}

export function BasicMemoEditForm({ draft, setDraft, onSave, onCancel }: { draft: Person; setDraft: React.Dispatch<React.SetStateAction<Person>>; onSave: () => void; onCancel: () => void }) {
  const set = (key: keyof Person, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  return <div className="stack compact"><Field label="呼び名" required value={draft.nickname} onChange={(value) => set('nickname', value)} /><Field label="関係" value={draft.relation} onChange={(value) => set('relation', value)} /><BasicAttributeFields values={draft} onChange={(key, value) => set(key, value)} /><Field label="見た目・雰囲気" multiline textareaSize="compact" value={draft.appearanceNote} onChange={(value) => set('appearanceNote', value)} /><Field label="性格" multiline textareaSize="compact" value={draft.personalityNote} onChange={(value) => set('personalityNote', value)} /><Field label="好きなこと" multiline textareaSize="compact" value={draft.likesNote} onChange={(value) => set('likesNote', value)} /><Field label="苦手・嫌いなもの" multiline textareaSize="compact" value={draft.dislikesNote} onChange={(value) => set('dislikesNote', value)} /><Field label="その人らしさメモ" multiline textareaSize="compact" value={draft.uniquenessNote} onChange={(value) => set('uniquenessNote', value)} /><div className="button-row"><button className="primary inline-primary" type="button" onClick={onSave}>保存する</button><button className="secondary" type="button" onClick={onCancel}>キャンセル</button></div></div>;
}

export function MeetBeforeMemoEditForm({ draft, setDraft, onSave, onCancel }: { draft: Person; setDraft: React.Dispatch<React.SetStateAction<Person>>; onSave: () => void; onCancel: () => void }) {
  const set = (key: keyof Person, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  return <div className="stack compact"><Field label="覚えておきたいこと" multiline textareaSize="medium" value={draft.rememberNote} onChange={(value) => set('rememberNote', value)} /><Field label="次に話したいこと" multiline textareaSize="medium" value={draft.nextTalkNote} onChange={(value) => set('nextTalkNote', value)} /><Field label="自分が感じていること" multiline textareaSize="medium" value={draft.feelingNote} onChange={(value) => set('feelingNote', value)} /><Field label="自由メモ" multiline textareaSize="medium" value={draft.memo} onChange={(value) => set('memo', value)} /><div className="button-row"><button className="primary inline-primary" type="button" onClick={onSave}>保存する</button><button className="secondary" type="button" onClick={onCancel}>キャンセル</button></div></div>;
}

export function ConversationFields({ value, setValue }: { value: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'> | Conversation; setValue: React.Dispatch<React.SetStateAction<any>> }) {
  const set = (key: keyof Conversation, next: string) => setValue((current: Conversation) => ({ ...current, [key]: next }));
  return <><Field label="会った日・話した日" type="date" value={value.metDate} onChange={(next) => set('metDate', next)} /><Field label="場所・場面" value={value.placeNote} onChange={(next) => set('placeNote', next)} /><Field label="話したこと" multiline textareaSize="long" value={value.talkedAbout} onChange={(next) => set('talkedAbout', next)} /><Field label="感じたこと・メモ" multiline textareaSize="long" value={value.memo} onChange={(next) => set('memo', next)} /></>;
}


