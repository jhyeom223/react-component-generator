import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 25+의 실험적 Web Storage 전역이 `--localstorage-file` 없이 undefined로 jsdom의 localStorage를 가린다.
// 이 경우 jsdom 인스턴스의 Storage를 전역에 연결한다.
const jsdomWindow = (globalThis as { jsdom?: { window: Window } }).jsdom?.window;
if (typeof globalThis.localStorage === 'undefined' && jsdomWindow) {
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      get: () => jsdomWindow[name],
    });
  }
}

// 각 테스트 후 렌더된 DOM을 정리해 테스트 간 격리를 보장한다.
afterEach(() => {
  cleanup();
});
