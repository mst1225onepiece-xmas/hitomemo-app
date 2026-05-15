export type View = 'add' | 'list' | 'settings';

export type HitomemoData = {
  people: Person[];
  conversations: Conversation[];
};

export type Person = {
  id: string;
  nickname: string;
  relation: string;
  ageNote: string;
  genderNote: string;
  heightNote: string;
  jobNote: string;
  mbtiNote: string;
  appearanceNote: string;
  personalityNote: string;
  likesNote: string;
  dislikesNote: string;
  uniquenessNote: string;
  rememberNote: string;
  nextTalkNote: string;
  feelingNote: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type Conversation = {
  id: string;
  personId: string;
  metDate: string;
  placeNote: string;
  talkedAbout: string;
  nextTalkNote: string;
  feelingNote: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type ImportPreview = {
  loadedPeople: number;
  loadedConversations: number;
  newPeople: Person[];
  newConversations: Conversation[];
  duplicatePeople: number;
  duplicateConversations: number;
  errors: string[];
  warnings: string[];
};

export const DATA_KEY = 'yuki-hitomemo-data';
export const ACTIVE_VIEW_KEY = 'yuki-hitomemo-active-view';

export const emptyPerson: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> = {
  nickname: '', relation: '', ageNote: '', genderNote: '', heightNote: '', jobNote: '', mbtiNote: '', appearanceNote: '', personalityNote: '', likesNote: '', dislikesNote: '', uniquenessNote: '', rememberNote: '', nextTalkNote: '', feelingNote: '', memo: '',
};

export function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function nowString() {
  return new Date().toISOString();
}

export function emptyConversation(personId = ''): Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'> {
  return { personId, metDate: todayString(), placeNote: '', talkedAbout: '', nextTalkNote: '', feelingNote: '', memo: '' };
}

export function createId(prefix: string) {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

