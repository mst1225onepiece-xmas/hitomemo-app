import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { Download, FileText, List, Plus, Search, Settings, Trash2 } from 'lucide-react';
import { ACTIVE_VIEW_KEY, DATA_KEY, Conversation, HitomemoData, ImportPreview, Person, View, createId, emptyConversation, emptyPerson, nowString } from './types';
import { conversationHasContent, formatDateTime, loadActiveView, loadData, saveActiveView, saveData, sortConversations } from './storage';
import { buildMarkdown, downloadFile, jsonBackupName, markdownExportName } from './exporters';
import { createImportPreview } from './importer';
import { BasicAttributeFields, BasicMemoEditForm, BasicMemoSummary, ConversationFields, Field, MeetBeforeMemoEditForm, MeetBeforeMemoSummary, PrivacyNote } from './components';

export default function App() {
  const [data, setData] = useState<HitomemoData>(() => loadData());
  const [activeView, setActiveView] = useState<View>(() => loadActiveView());
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const persist = (next: HitomemoData) => { setData(next); saveData(next); };
  const changeView = (view: View) => { setSelectedPersonId(null); setActiveView(view); saveActiveView(view); };
  const selectPerson = (id: string) => {
    setSelectedPersonId(id);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  };
  const selectedPerson = data.people.find((person) => person.id === selectedPersonId) || null;
  return <div className="app-shell"><header className="topbar"><div><p className="eyebrow">やわらかい会話記録</p><h1>ひとめも</h1></div></header><main>{selectedPerson ? <DetailView person={selectedPerson} data={data} persist={persist} onBack={() => setSelectedPersonId(null)} /> : activeView === 'add' ? <AddView data={data} persist={persist} onDone={() => changeView('list')} /> : activeView === 'list' ? <ListView data={data} onSelect={selectPerson} /> : <SettingsView data={data} persist={persist} />}</main>{!selectedPerson && <nav className="bottom-nav" aria-label="画面切り替え"><NavButton active={activeView === 'add'} icon={<Plus size={20} />} label="追加" onClick={() => changeView('add')} /><NavButton active={activeView === 'list'} icon={<List size={20} />} label="一覧" onClick={() => changeView('list')} /><NavButton active={activeView === 'settings'} icon={<Settings size={20} />} label="設定" onClick={() => changeView('settings')} /></nav>}</div>;
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className={active ? 'nav-item active' : 'nav-item'} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function CollapsiblePanel({ title, open, onToggle, children, help }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode; help?: string }) {
  return <section className="panel collapsible"><button className="collapse-toggle" type="button" onClick={onToggle} aria-expanded={open}><span>{open ? '▼' : '▶'}</span><strong>{title}</strong></button>{open && <div className="collapse-body">{help && <p className="section-help">{help}</p>}{children}</div>}</section>;
}

function conversationMemoText(conversation: Conversation) {
  return [conversation.feelingNote, conversation.memo].filter((value) => value.trim()).join('\n') || '（未入力）';
}

function getPersonLastUpdated(person: Person, conversations: Conversation[]) {
  return conversations
    .filter((conversation) => conversation.personId === person.id)
    .reduce((latest, conversation) => {
      const dates = [conversation.updatedAt, conversation.createdAt].filter(Boolean).sort();
      const conversationLatest = dates[dates.length - 1] || '';
      return conversationLatest > latest ? conversationLatest : latest;
    }, person.updatedAt || person.createdAt);
}

function AddView({ data, persist, onDone }: { data: HitomemoData; persist: (data: HitomemoData) => void; onDone: () => void }) {
  const [person, setPerson] = useState({ ...emptyPerson });
  const [conversation, setConversation] = useState(emptyConversation());
  const [error, setError] = useState('');
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [talkMemoOpen, setTalkMemoOpen] = useState(false);
  const [firstConversationOpen, setFirstConversationOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const updatePerson = (key: keyof typeof person, value: string) => setPerson((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!person.nickname.trim()) { setError('呼び名を入力してください。'); return; }
    const timestamp = nowString();
    const newPerson: Person = { ...person, nickname: person.nickname.trim(), id: createId('person'), createdAt: timestamp, updatedAt: timestamp };
    const nextConversations = [...data.conversations];
    if (conversationHasContent(conversation)) nextConversations.push({ ...conversation, personId: newPerson.id, id: createId('conversation'), createdAt: timestamp, updatedAt: timestamp });
    persist({ people: [...data.people, newPerson], conversations: nextConversations });
    setPerson({ ...emptyPerson }); setConversation(emptyConversation()); setError(''); onDone();
  };
  return <form className="stack" onSubmit={submit}>{error && <p className="error">{error}</p>}<section className="panel"><h2>基本</h2><Field label="呼び名" required value={person.nickname} onChange={(value) => updatePerson('nickname', value)} /><Field label="関係" value={person.relation} onChange={(value) => updatePerson('relation', value)} /><button className="primary" type="submit">登録する</button></section><CollapsiblePanel title="会話のための特徴" open={featuresOpen} onToggle={() => setFeaturesOpen((open) => !open)}><BasicAttributeFields values={person} onChange={(key, value) => updatePerson(key, value)} /><Field label="見た目・雰囲気" hint="外見、話し方、声、服装、第一印象など、思い出すための外側の手がかり。" multiline textareaSize="compact" value={person.appearanceNote} onChange={(value) => updatePerson('appearanceNote', value)} /><Field label="性格" multiline textareaSize="compact" value={person.personalityNote} onChange={(value) => updatePerson('personalityNote', value)} /><Field label="好きなこと" multiline textareaSize="compact" value={person.likesNote} onChange={(value) => updatePerson('likesNote', value)} /><Field label="苦手・嫌いなもの" multiline textareaSize="compact" value={person.dislikesNote} onChange={(value) => updatePerson('dislikesNote', value)} /><Field label="その人らしさメモ" hint="考え方、価値観、距離感、空気感、内面っぽい印象など、分類しづらいその人らしさ。" multiline textareaSize="compact" value={person.uniquenessNote} onChange={(value) => updatePerson('uniquenessNote', value)} /></CollapsiblePanel><CollapsiblePanel title="会う前のメモ" open={talkMemoOpen} onToggle={() => setTalkMemoOpen((open) => !open)} help="実際に会う前に、覚えておきたいことや話したいことを書く場所です。"><Field label="覚えておきたいこと" multiline textareaSize="medium" value={person.rememberNote} onChange={(value) => updatePerson('rememberNote', value)} /><Field label="次に話したいこと" multiline textareaSize="medium" value={person.nextTalkNote} onChange={(value) => updatePerson('nextTalkNote', value)} /><Field label="自分が感じていること" multiline textareaSize="medium" value={person.feelingNote} onChange={(value) => updatePerson('feelingNote', value)} /><Field label="自由メモ" multiline textareaSize="medium" value={person.memo} onChange={(value) => updatePerson('memo', value)} /></CollapsiblePanel><CollapsiblePanel title="初回会話メモ" open={firstConversationOpen} onToggle={() => setFirstConversationOpen((open) => !open)} help="実際に会ったあと、話した内容や感じたことを書く場所です。"><ConversationFields value={conversation} setValue={setConversation} /></CollapsiblePanel><button className="primary details-submit" type="submit">登録する</button><CollapsiblePanel title="このアプリの使い方・注意" open={privacyOpen} onToggle={() => setPrivacyOpen((open) => !open)}><PrivacyNote /></CollapsiblePanel></form>;
}

function ListView({ data, onSelect }: { data: HitomemoData; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(() => data.people.filter((person) => {
    if (!normalized) return true;
    const conversations = data.conversations.filter((conversation) => conversation.personId === person.id);
    const haystack = [person.nickname, person.relation, person.ageNote, person.genderNote, person.heightNote, person.jobNote, person.mbtiNote, person.appearanceNote, person.personalityNote, person.likesNote, person.dislikesNote, person.uniquenessNote, person.rememberNote, person.nextTalkNote, person.feelingNote, person.memo, ...conversations.flatMap((item) => [item.metDate, item.placeNote, item.talkedAbout, item.nextTalkNote, item.feelingNote, item.memo])].join('\n').toLowerCase();
    return haystack.includes(normalized);
  }).sort((a, b) => getPersonLastUpdated(b, data.conversations).localeCompare(getPersonLastUpdated(a, data.conversations))), [data, normalized]);
  return <section className="stack"><label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="呼び名、関係、会話メモから検索" /></label><div className="muted-line">{filtered.length}件</div>{filtered.length === 0 ? <p className="empty">まだ該当する人メモがありません。</p> : filtered.map((person) => { const count = data.conversations.filter((item) => item.personId === person.id).length; return <button className="person-card" key={person.id} onClick={() => onSelect(person.id)}><strong>{person.nickname}</strong><span>{person.relation || '関係未入力'}</span><p>次に話したいこと：{person.nextTalkNote || '（未入力）'}</p><p>覚えておきたいこと：{person.rememberNote || '（未入力）'}</p><small>会話メモ {count}件 / 最終更新 {formatDateTime(getPersonLastUpdated(person, data.conversations))}</small></button>; })}</section>;
}

function DetailView({ person, data, persist, onBack }: { person: Person; data: HitomemoData; persist: (data: HitomemoData) => void; onBack: () => void }) {
  const [basicEditing, setBasicEditing] = useState(false);
  const [meetBeforeEditing, setMeetBeforeEditing] = useState(false);
  const [basicDraft, setBasicDraft] = useState<Person>(person);
  const [meetBeforeDraft, setMeetBeforeDraft] = useState<Person>(person);
  const [newConversation, setNewConversation] = useState(emptyConversation(person.id));
  const [basicOpen, setBasicOpen] = useState(false);
  const [meetBeforeOpen, setMeetBeforeOpen] = useState(true);
  const [addConversationOpen, setAddConversationOpen] = useState(false);
  const [conversationListOpen, setConversationListOpen] = useState(true);
  const conversations = sortConversations(data.conversations.filter((item) => item.personId === person.id));
  const saveBasicMemo = () => {
    if (!basicDraft.nickname.trim()) return;
    const timestamp = nowString();
    persist({ ...data, people: data.people.map((item) => item.id === person.id ? { ...item, nickname: basicDraft.nickname.trim(), relation: basicDraft.relation, ageNote: basicDraft.ageNote, genderNote: basicDraft.genderNote, heightNote: basicDraft.heightNote, jobNote: basicDraft.jobNote, mbtiNote: basicDraft.mbtiNote, appearanceNote: basicDraft.appearanceNote, personalityNote: basicDraft.personalityNote, likesNote: basicDraft.likesNote, dislikesNote: basicDraft.dislikesNote, uniquenessNote: basicDraft.uniquenessNote, updatedAt: timestamp } : item) });
    setBasicEditing(false);
  };
  const saveMeetBeforeMemo = () => {
    const timestamp = nowString();
    persist({ ...data, people: data.people.map((item) => item.id === person.id ? { ...item, rememberNote: meetBeforeDraft.rememberNote, nextTalkNote: meetBeforeDraft.nextTalkNote, feelingNote: meetBeforeDraft.feelingNote, memo: meetBeforeDraft.memo, updatedAt: timestamp } : item) });
    setMeetBeforeEditing(false);
  };
  const deletePerson = () => { if (!confirm('この人メモと紐づく会話メモを削除します。よろしいですか？')) return; persist({ people: data.people.filter((item) => item.id !== person.id), conversations: data.conversations.filter((item) => item.personId !== person.id) }); onBack(); };
  const addConversation = () => { if (!conversationHasContent(newConversation)) return; const timestamp = nowString(); const conversation: Conversation = { ...newConversation, personId: person.id, id: createId('conversation'), createdAt: timestamp, updatedAt: timestamp }; persist({ people: data.people.map((item) => item.id === person.id ? { ...item, updatedAt: timestamp } : item), conversations: [...data.conversations, conversation] }); setNewConversation(emptyConversation(person.id)); };
  return <section className="stack detail"><button className="ghost" onClick={onBack}>← 一覧に戻る</button><div className="detail-head"><div><h2>{person.nickname}</h2><p>{person.relation || '関係未入力'}</p></div><div className="button-row"><button className="danger" onClick={deletePerson}><Trash2 size={16} />削除</button></div></div><CollapsiblePanel title="基本メモ" open={basicOpen} onToggle={() => setBasicOpen((open) => !open)}>{basicEditing ? <BasicMemoEditForm draft={basicDraft} setDraft={setBasicDraft} onSave={saveBasicMemo} onCancel={() => { setBasicDraft(person); setBasicEditing(false); }} /> : <div className="stack compact"><BasicMemoSummary person={person} /><button className="secondary" type="button" onClick={() => { setBasicDraft(person); setBasicEditing(true); }}>編集する</button></div>}</CollapsiblePanel><CollapsiblePanel title="会う前のメモ" open={meetBeforeOpen} onToggle={() => setMeetBeforeOpen((open) => !open)}>{meetBeforeEditing ? <MeetBeforeMemoEditForm draft={meetBeforeDraft} setDraft={setMeetBeforeDraft} onSave={saveMeetBeforeMemo} onCancel={() => { setMeetBeforeDraft(person); setMeetBeforeEditing(false); }} /> : <div className="stack compact"><MeetBeforeMemoSummary person={person} /><button className="secondary" type="button" onClick={() => { setMeetBeforeDraft(person); setMeetBeforeEditing(true); }}>会う前のメモを編集</button></div>}</CollapsiblePanel><CollapsiblePanel title="会話メモ追加" open={addConversationOpen} onToggle={() => setAddConversationOpen((open) => !open)}><ConversationFields value={newConversation} setValue={setNewConversation} /><button className="primary" type="button" onClick={addConversation}>会話メモを追加</button></CollapsiblePanel><button className="ghost" onClick={onBack}>← 一覧に戻る</button><CollapsiblePanel title="会話メモ一覧" open={conversationListOpen} onToggle={() => setConversationListOpen((open) => !open)}>{conversations.length === 0 ? <p className="empty">会話メモはまだありません。</p> : conversations.map((conversation) => <ConversationCard key={conversation.id} conversation={conversation} data={data} persist={persist} personId={person.id} />)}</CollapsiblePanel><button className="ghost" onClick={onBack}>← 一覧に戻る</button></section>;
}

function ConversationCard({ conversation, data, persist, personId }: { conversation: Conversation; data: HitomemoData; persist: (data: HitomemoData) => void; personId: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conversation);
  const save = () => { const updated = { ...draft, updatedAt: nowString() }; persist({ people: data.people.map((item) => item.id === personId ? { ...item, updatedAt: updated.updatedAt } : item), conversations: data.conversations.map((item) => item.id === conversation.id ? updated : item) }); setEditing(false); };
  const remove = () => { if (!confirm('この会話メモを削除します。よろしいですか？')) return; const timestamp = nowString(); persist({ people: data.people.map((item) => item.id === personId ? { ...item, updatedAt: timestamp } : item), conversations: data.conversations.filter((item) => item.id !== conversation.id) }); };
  return <article className="conversation-card"><div className="conversation-head"><strong>{conversation.metDate}</strong></div>{editing ? <div className="stack compact"><ConversationFields value={draft} setValue={setDraft} /><div className="conversation-actions"><button className="secondary small-action" type="button" onClick={() => setEditing(false)}>閉じる</button><button className="primary inline-primary small-action" type="button" onClick={save}>保存する</button></div></div> : <><dl className="memo-list small"><dt>場所・場面</dt><dd>{conversation.placeNote || '（未入力）'}</dd><dt>話したこと</dt><dd>{conversation.talkedAbout || '（未入力）'}</dd><dt>感じたこと・メモ</dt><dd>{conversationMemoText(conversation)}</dd></dl><div className="conversation-actions"><button className="secondary small-action" type="button" onClick={() => setEditing(true)}>編集</button><button className="danger small-action" type="button" onClick={remove}><Trash2 size={14} />削除</button></div></>}</article>;
}

function SettingsView({ data, persist }: { data: HitomemoData; persist: (data: HitomemoData) => void }) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [message, setMessage] = useState('');
  const exportJson = () => downloadFile(jsonBackupName(), JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
  const exportMarkdown = () => downloadFile(markdownExportName(), buildMarkdown(data), 'text/markdown;charset=utf-8');
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(''); setPreview(null);
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try { setPreview(await createImportPreview(file, data)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'JSONを読み込めませんでした。現在のデータは変更していません。'); }
  };
  const confirmImport = () => { if (!preview) return; persist({ people: [...data.people, ...preview.newPeople], conversations: [...data.conversations, ...preview.newConversations] }); setMessage('新規データだけ追加しました。'); setPreview(null); };
  return <section className="stack"><PrivacyNote /><section className="panel"><h2>保存と出力</h2><p className="muted">JSON：アプリに戻すための保存・復元形式。Markdown：人間・AIが読むための振り返り・分析用形式。</p><div className="action-grid"><button className="secondary" onClick={exportJson}><Download size={18} />JSONエクスポート</button><label className="file-button"><FileText size={18} />JSON追加インポート<input type="file" accept="application/json,.json" onChange={handleImport} /></label><button className="secondary" onClick={exportMarkdown}><Download size={18} />Markdownエクスポート</button></div>{message && <p className="message">{message}</p>}</section><section className="panel"><h2>保存キー</h2><dl className="memo-list small"><dt>データ</dt><dd>{DATA_KEY}</dd><dt>最後に開いていた画面</dt><dd>{ACTIVE_VIEW_KEY}</dd></dl></section>{preview && <section className="panel"><h2>インポート前プレビュー</h2><dl className="memo-list small"><dt>読み込んだ people 件数</dt><dd>{preview.loadedPeople}</dd><dt>読み込んだ conversations 件数</dt><dd>{preview.loadedConversations}</dd><dt>新規追加される people 件数</dt><dd>{preview.newPeople.length}</dd><dt>新規追加される conversations 件数</dt><dd>{preview.newConversations.length}</dd><dt>重複としてスキップされる people 件数</dt><dd>{preview.duplicatePeople}</dd><dt>重複としてスキップされる conversations 件数</dt><dd>{preview.duplicateConversations}</dd><dt>エラー件数</dt><dd>{preview.errors.length}</dd><dt>警告件数</dt><dd>{preview.warnings.length}</dd></dl>{preview.errors.map((error) => <p className="error" key={error}>{error}</p>)}{[...new Set(preview.warnings)].map((warning) => <p className="warning" key={warning}>{warning}</p>)}<button className="primary" onClick={confirmImport}>新規データだけ追加する</button></section>}</section>;
}




