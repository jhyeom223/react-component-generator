import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { GeneratedComponent } from '../types';
import {
  STORAGE_KEYS,
  loadProvider,
  saveProvider,
  loadHistory,
  saveHistory,
  loadComponents,
  saveComponents,
} from './storage';

const sample: GeneratedComponent = {
  id: '1',
  prompt: '카드',
  code: 'render(<div />)',
  createdAt: new Date('2026-11-05T01:02:03.000Z'),
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('provider', () => {
  it('저장된 값이 없으면 기본값 google을 반환한다', () => {
    expect(loadProvider()).toBe('google');
  });

  it('저장한 provider를 다시 읽어온다', () => {
    saveProvider('anthropic');
    expect(loadProvider()).toBe('anthropic');
  });

  it('알 수 없는 값이 저장돼 있으면 기본값을 반환한다', () => {
    localStorage.setItem(STORAGE_KEYS.provider, 'openai');
    expect(loadProvider()).toBe('google');
  });
});

describe('history', () => {
  it('저장된 값이 없으면 빈 배열을 반환한다', () => {
    expect(loadHistory()).toEqual([]);
  });

  it('저장한 히스토리를 다시 읽어온다', () => {
    saveHistory(['A', 'B']);
    expect(loadHistory()).toEqual(['A', 'B']);
  });

  it('JSON이 깨져 있으면 빈 배열을 반환한다', () => {
    localStorage.setItem(STORAGE_KEYS.history, '{깨짐');
    expect(loadHistory()).toEqual([]);
  });

  it('문자열이 아닌 항목은 걸러낸다', () => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(['A', 1, null, 'B']));
    expect(loadHistory()).toEqual(['A', 'B']);
  });
});

describe('components', () => {
  it('저장된 값이 없으면 빈 배열을 반환한다', () => {
    expect(loadComponents()).toEqual([]);
  });

  it('저장한 컴포넌트를 createdAt을 Date로 복원해 읽어온다', () => {
    saveComponents([sample]);
    const [loaded] = loadComponents();
    expect(loaded.createdAt).toBeInstanceOf(Date);
    expect(loaded).toEqual(sample);
  });

  it('필수 필드가 빠졌거나 날짜가 잘못된 항목은 걸러낸다', () => {
    localStorage.setItem(
      STORAGE_KEYS.components,
      JSON.stringify([
        { id: '1', prompt: 'p', code: 'c', createdAt: sample.createdAt.toISOString() },
        { id: '2', prompt: 'p' },
        { id: '3', prompt: 'p', code: 'c', createdAt: 'not-a-date' },
      ]),
    );
    expect(loadComponents().map((c) => c.id)).toEqual(['1']);
  });
});

describe('storage 접근 실패', () => {
  it('읽기가 예외를 던지면 기본값을 반환한다', () => {
    vi.spyOn(Object.getPrototypeOf(localStorage), 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(loadProvider()).toBe('google');
    expect(loadComponents()).toEqual([]);
  });

  it('쓰기가 예외를 던져도(용량 초과 등) 앱으로 전파하지 않는다', () => {
    vi.spyOn(Object.getPrototypeOf(localStorage), 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveComponents([sample])).not.toThrow();
  });
});

describe('API 키', () => {
  it('어떤 저장 키에도 API 키 항목이 없다', () => {
    expect(Object.values(STORAGE_KEYS).some((k) => /key|api/i.test(k))).toBe(false);
  });
});
