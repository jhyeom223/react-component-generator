// 프롬프트 히스토리 갱신용 순수 함수. 부수효과가 없어 단위 테스트가 가능하다.

export const MAX_HISTORY = 10;

/** 프롬프트를 맨 앞에 추가한 새 히스토리를 반환한다. 중복은 맨 앞으로 옮기고 최대 개수를 넘으면 오래된 것을 버린다. */
export function addToHistory(history: string[], prompt: string): string[] {
  const trimmed = prompt.trim();
  if (!trimmed) return history;
  return [trimmed, ...history.filter((p) => p !== trimmed)].slice(0, MAX_HISTORY);
}
