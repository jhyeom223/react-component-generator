import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';
import { loadComponents, saveComponents } from '../utils/storage';
import type { GeneratedComponent } from '../types';

const saved: GeneratedComponent = {
  id: 'saved-1',
  prompt: '저장된 카드',
  code: 'render(<div />)',
  createdAt: new Date('2026-11-05T00:00:00.000Z'),
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useComponentGenerator 영속화', () => {
  it('마운트 시 localStorage에 저장된 컴포넌트 목록을 복원한다', () => {
    saveComponents([saved]);
    const { result } = renderHook(() => useComponentGenerator());
    expect(result.current.components).toEqual([saved]);
  });

  it('생성에 성공하면 새 컴포넌트가 localStorage에 저장된다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: 'render(<p />)' }) }),
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(() => result.current.generate('새 버튼', undefined, 'google'));

    expect(loadComponents().map((c) => c.prompt)).toEqual(['새 버튼']);
  });

  it('컴포넌트를 삭제하면 localStorage에서도 사라진다', () => {
    saveComponents([saved]);
    const { result } = renderHook(() => useComponentGenerator());

    act(() => result.current.removeComponent(saved.id));

    expect(loadComponents()).toEqual([]);
  });

  it('전체 삭제하면 localStorage 목록도 비워진다', () => {
    saveComponents([saved, { ...saved, id: 'saved-2' }]);
    const { result } = renderHook(() => useComponentGenerator());

    act(() => result.current.clearAll());

    expect(loadComponents()).toEqual([]);
  });
});
