import { Conversation, HitomemoData, ImportPreview, Person } from './types';
import { normalizeConversation, normalizePerson } from './storage';

function isDuplicatePerson(person: Person, existing: Person[]) {
  return existing.some((item) => item.id === person.id || (item.nickname === person.nickname && item.createdAt === person.createdAt));
}

function isDuplicateConversation(conversation: Conversation, existing: Conversation[]) {
  return existing.some((item) => item.id === conversation.id || (item.personId === conversation.personId && item.metDate === conversation.metDate && item.talkedAbout === conversation.talkedAbout && item.createdAt === conversation.createdAt));
}

export async function createImportPreview(file: File, current: HitomemoData): Promise<ImportPreview> {
  const parsed = JSON.parse(await file.text()) as Partial<HitomemoData>;
  if (!Array.isArray(parsed.people) || !Array.isArray(parsed.conversations)) {
    throw new Error('JSONの形式が正しくありません。people と conversations は配列である必要があります。');
  }
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalizedPeople = parsed.people.map((item, index) => {
    const person = normalizePerson(item);
    if (!person) errors.push(`people ${index + 1}件目の形式が不十分です。`);
    return person;
  }).filter(Boolean) as Person[];
  const normalizedConversations = parsed.conversations.map((item, index) => {
    const conversation = normalizeConversation(item);
    if (!conversation) errors.push(`conversations ${index + 1}件目の形式が不十分です。`);
    return conversation;
  }).filter(Boolean) as Conversation[];

  const newPeople: Person[] = [];
  let duplicatePeople = 0;
  normalizedPeople.forEach((person) => {
    if (isDuplicatePerson(person, [...current.people, ...newPeople])) duplicatePeople += 1;
    else newPeople.push(person);
  });

  const availablePeople = new Set([...current.people, ...newPeople].map((person) => person.id));
  const newConversations: Conversation[] = [];
  let duplicateConversations = 0;
  normalizedConversations.forEach((conversation) => {
    if (!availablePeople.has(conversation.personId)) {
      warnings.push('紐づく人メモが見つからない会話メモは追加しませんでした。');
      return;
    }
    if (isDuplicateConversation(conversation, [...current.conversations, ...newConversations])) duplicateConversations += 1;
    else newConversations.push(conversation);
  });

  return { loadedPeople: parsed.people.length, loadedConversations: parsed.conversations.length, newPeople, newConversations, duplicatePeople, duplicateConversations, errors, warnings };
}
