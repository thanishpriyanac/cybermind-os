import { SecurityObject, ToolkitHistoryItem } from './types';

const TOOLKIT_HISTORY_KEY = 'cybermind_toolkit_history';
const TOOLKIT_ACTIVE_OBJECT_KEY = 'cybermind_toolkit_active_object';

export function saveToolkitHistoryItem(item: Omit<ToolkitHistoryItem, 'id' | 'timestamp'>): ToolkitHistoryItem {
  const newItem: ToolkitHistoryItem = {
    ...item,
    id: `tk-hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return newItem;

  try {
    const existingRaw = localStorage.getItem(TOOLKIT_HISTORY_KEY);
    const history: ToolkitHistoryItem[] = existingRaw ? JSON.parse(existingRaw) : [];
    // Keep max 50 history items
    const updated = [newItem, ...history.filter(h => !(h.toolId === item.toolId && h.target === item.target))].slice(0, 50);
    localStorage.setItem(TOOLKIT_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save toolkit history', e);
  }

  return newItem;
}

export function getToolkitHistory(toolId?: string): ToolkitHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const existingRaw = localStorage.getItem(TOOLKIT_HISTORY_KEY);
    if (!existingRaw) return [];
    const history: ToolkitHistoryItem[] = JSON.parse(existingRaw);
    if (toolId) {
      return history.filter(h => h.toolId === toolId);
    }
    return history;
  } catch (e) {
    return [];
  }
}

export function clearToolkitHistory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOOLKIT_HISTORY_KEY);
  }
}

export function setActiveSecurityObject(obj: SecurityObject): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOOLKIT_ACTIVE_OBJECT_KEY, JSON.stringify(obj));
  }
}

export function getActiveSecurityObject(): SecurityObject | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TOOLKIT_ACTIVE_OBJECT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
