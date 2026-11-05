import { describe, it, expect } from 'vitest';
import { validatePrompt, MAX_PROMPT_LENGTH } from './validatePrompt';

describe('validatePrompt', () => {
  it('500자를 초과하면 에러 메시지를 반환한다', () => {
    expect(validatePrompt('a'.repeat(MAX_PROMPT_LENGTH + 1))).toBe(
      '프롬프트는 500자 이하로 입력해주세요.',
    );
  });

  it('이모지처럼 UTF-16 길이가 2인 문자도 한 글자로 센다', () => {
    expect(validatePrompt('😀'.repeat(MAX_PROMPT_LENGTH))).toBeNull();
  });

  it('앞뒤 공백은 글자 수에 포함하지 않는다', () => {
    expect(validatePrompt(`  ${'a'.repeat(MAX_PROMPT_LENGTH)}\n `)).toBeNull();
  });
});
