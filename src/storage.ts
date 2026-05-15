import { ACTIVE_VIEW_KEY, Conversation, DATA_KEY, HitomemoData, Person, View, todayString } from './types';

export function safeText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function normalizePerson(value: unknown): Person | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<Person>;
  if (!safeText(item.id) || !safeText(item.nickname) || !safeText(item.createdAt)) return null;
  const createdAt = safeText(item.createdAt);
  return {
    id: safeText(item.id), nickname: safeText(item.nickname), relation: safeText(item.relation), ageNote: safeText(item.ageNote), genderNote: safeText(item.genderNote), heightNote: safeText(item.heightNote), jobNote: safeText(item.jobNote), mbtiNote: safeText(item.mbtiNote), appearanceNote: safeText(item.appearanceNote), personalityNote: safeText(item.personalityNote), likesNote: safeText(item.likesNote), dislikesNote: safeText(item.dislikesNote), uniquenessNote: safeText(item.uniquenessNote), rememberNote: safeText(item.rememberNote), nextTalkNote: safeText(item.nextTalkNote), feelingNote: safeText(item.feelingNote), memo: safeText(item.memo), createdAt, updatedAt: safeText(item.updatedAt) || createdAt,
  };
}

export function normalizeConversation(value: unknown): Conversation | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<Conversation>;
  if (!safeText(item.id) || !safeText(item.personId) || !safeText(item.createdAt)) return null;
  const createdAt = safeText(item.createdAt);
  return { id: safeText(item.id), personId: safeText(item.personId), metDate: safeText(item.metDate) || todayString(), placeNote: safeText((item as Partial<Conversation> & { placeNote?: string; sceneNote?: string }).placeNote) || safeText((item as Partial<Conversation> & { placeNote?: string; sceneNote?: string }).sceneNote), talkedAbout: safeText(item.talkedAbout), nextTalkNote: safeText(item.nextTalkNote), feelingNote: safeText(item.feelingNote), memo: safeText(item.memo), createdAt, updatedAt: safeText(item.updatedAt) || createdAt };
}

export function loadData(): HitomemoData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return { people: [], conversations: [] };
    const parsed = JSON.parse(raw) as Partial<HitomemoData>;
    return {
      people: Array.isArray(parsed.people) ? parsed.people.map(normalizePerson).filter(Boolean) as Person[] : [],
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations.map(normalizeConversation).filter(Boolean) as Conversation[] : [],
    };
  } catch {
    return { people: [], conversations: [] };
  }
}

export function saveData(data: HitomemoData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function loadActiveView(): View {
  const value = localStorage.getItem(ACTIVE_VIEW_KEY);
  return value === 'add' || value === 'list' || value === 'settings' ? value : 'add';
}

export function saveActiveView(view: View) {
  localStorage.setItem(ACTIVE_VIEW_KEY, view);
}

export function conversationHasContent(conversation: Pick<Conversation, 'placeNote' | 'talkedAbout' | 'memo'> & Partial<Pick<Conversation, 'nextTalkNote' | 'feelingNote'>>) {
  return [conversation.placeNote, conversation.talkedAbout, conversation.memo].some((value) => value.trim());
}

export function sortConversations(items: Conversation[]) {
  return [...items].sort((a, b) => {
    const dateCompare = b.metDate.localeCompare(a.metDate);
    return dateCompare !== 0 ? dateCompare : b.createdAt.localeCompare(a.createdAt);
  });
}

export function formatDateTime(value: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ja-JP');
}

