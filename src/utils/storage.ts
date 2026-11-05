// localStorage 영속화 헬퍼. API 키는 의도적으로 다루지 않는다 (src/AGENTS.md Local Golden Rules).
// 저장소 접근 실패(비공개 모드, 용량 초과)나 손상된 값은 기본값으로 대체해 앱 동작을 막지 않는다.
import type { GeneratedComponent, Provider } from '../types';

export const STORAGE_KEYS = {
  provider: 'rcg:provider',
  history: 'rcg:prompt-history',
  components: 'rcg:components',
} as const;

const PROVIDERS: readonly Provider[] = ['anthropic', 'google'];
const DEFAULT_PROVIDER: Provider = 'google';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readJSON(key: string): unknown {
  const raw = read(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 저장 실패는 무시한다. 영속화는 편의 기능이라 앱 동작을 막지 않는다.
  }
}

export function loadProvider(): Provider {
  const value = read(STORAGE_KEYS.provider);
  return PROVIDERS.find((p) => p === value) ?? DEFAULT_PROVIDER;
}

export function saveProvider(provider: Provider): void {
  write(STORAGE_KEYS.provider, provider);
}

export function loadHistory(): string[] {
  const value = readJSON(STORAGE_KEYS.history);
  return Array.isArray(value) ? value.filter((p): p is string => typeof p === 'string') : [];
}

export function saveHistory(history: string[]): void {
  write(STORAGE_KEYS.history, JSON.stringify(history));
}

function toComponent(item: unknown): GeneratedComponent | null {
  if (typeof item !== 'object' || item === null) return null;
  const { id, prompt, code, createdAt } = item as Record<string, unknown>;
  if (typeof id !== 'string' || typeof prompt !== 'string' || typeof code !== 'string') return null;
  if (typeof createdAt !== 'string') return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return { id, prompt, code, createdAt: date };
}

export function loadComponents(): GeneratedComponent[] {
  const value = readJSON(STORAGE_KEYS.components);
  if (!Array.isArray(value)) return [];
  return value.map(toComponent).filter((c): c is GeneratedComponent => c !== null);
}

export function saveComponents(components: GeneratedComponent[]): void {
  write(STORAGE_KEYS.components, JSON.stringify(components));
}
