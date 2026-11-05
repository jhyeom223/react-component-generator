// 프롬프트 입력 검증용 순수 함수. 부수효과가 없어 단위 테스트가 가능하다.

export const MAX_PROMPT_LENGTH = 500;

/**
 * 프롬프트 길이를 검증한다. 문제가 없으면 null, 있으면 사용자에게 보여줄 에러 메시지를 반환한다.
 * 앞뒤 공백은 제외하고, 이모지 등 서로게이트 쌍도 한 글자로 센다(코드 포인트 기준).
 */
export function validatePrompt(prompt: string): string | null {
  if ([...prompt.trim()].length > MAX_PROMPT_LENGTH) {
    return `프롬프트는 ${MAX_PROMPT_LENGTH}자 이하로 입력해주세요.`;
  }
  return null;
}
