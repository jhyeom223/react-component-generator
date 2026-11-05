import { describe, it, expect } from 'vitest';
import { addToHistory, MAX_HISTORY } from './promptHistory';

describe('addToHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToHistory(['이전'], '새 프롬프트')).toEqual(['새 프롬프트', '이전']);
  });

  it('이미 있는 프롬프트는 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addToHistory(['A', 'B', 'C'], 'B')).toEqual(['B', 'A', 'C']);
  });

  it(`최대 ${MAX_HISTORY}개까지만 유지하고 오래된 항목을 버린다`, () => {
    const full = Array.from({ length: MAX_HISTORY }, (_, i) => `p${i}`);
    const next = addToHistory(full, '새 프롬프트');
    expect(next).toHaveLength(MAX_HISTORY);
    expect(next[0]).toBe('새 프롬프트');
    expect(next).not.toContain(`p${MAX_HISTORY - 1}`);
  });

  it('앞뒤 공백을 제거해 저장한다', () => {
    expect(addToHistory([], '  카드  ')).toEqual(['카드']);
  });

  it('공백뿐인 프롬프트는 추가하지 않는다', () => {
    expect(addToHistory(['A'], '   ')).toEqual(['A']);
  });

  it('원본 배열을 변경하지 않는다', () => {
    const history = ['A'];
    addToHistory(history, 'B');
    expect(history).toEqual(['A']);
  });
});
