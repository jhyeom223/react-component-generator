# src/AGENTS.md

## Module Context

React 19 + Vite 프론트엔드. 프롬프트 입력, 제공자/키 설정, 생성 결과의 실시간 미리보기와 코드 보기를 담당하며 `/api/*`를 통해서만 서버와 통신한다.

## Tech Stack & Constraints

- 상태 관리는 React 내장 훅만 사용한다. 전역 상태 라이브러리를 추가하지 않는다.
- 서버 호출은 `fetch`로 상대 경로 `/api/*`에 한다 (Vite proxy 경유).
- 스타일은 `App.css`, `index.css`의 일반 CSS 클래스. CSS-in-JS/Tailwind를 도입하지 않는다.
- `verbatimModuleSyntax`가 켜져 있어 타입은 `import type`으로 가져와야 한다 (`tsconfig.app.json:12`, 예: `App.tsx:5`).

## Implementation Patterns

- 컴포넌트는 named export 함수 + `XxxProps` interface 패턴 (`components/PromptInput.tsx:3,17`). `App.tsx`만 default export.
- 생성 API 호출과 결과 목록 상태는 `hooks/useComponentGenerator.ts`에 모은다. 컴포넌트에서 직접 `/api/generate`를 호출하지 않는다.
- 공유 타입은 `types/index.ts`에 둔다.
- 미리보기 리마운트는 `key` 증가로 처리한다 (`components/ComponentCard.tsx:17,75`).

## Testing Strategy

- 실행: 루트에서 `bun run test`. 파일명 `*.test.tsx`, 대상 컴포넌트 옆에 둔다.
- 환경은 jsdom, `test/setup.ts`가 jest-dom matcher 등록과 `cleanup`을 처리한다. 테스트 파일에서 중복 설정하지 않는다.
- 요소는 역할과 접근성 이름으로 찾는다 (`getByRole('button', { name: '컴포넌트 생성' })`, `components/PromptInput.test.tsx:9`). 버튼 문구나 `aria-label`을 바꾸면 테스트도 함께 수정한다.
- 사용자 상호작용은 `userEvent.setup()`을 사용한다.

## Local Golden Rules

- `LivePreview`는 `noInline` 모드다 (`components/LivePreview.tsx:10`). 생성 코드에 `render()` 호출이 필요하며, 이 모드를 끄면 서버의 `ensureRenderCall` 및 시스템 프롬프트 규칙과 충돌한다.
- `LiveError`를 제거하지 않는다 (`components/LivePreview.tsx:14`). AI 생성 코드는 실행 오류가 잦아 이것이 유일한 오류 표시 경로다.
- API 키는 메모리 state로만 보관한다 (`App.tsx:14`). localStorage/sessionStorage/URL에 저장하지 않으며, 제공자 변경 시 비운다 (`App.tsx:44`).
- 키가 비어 있으면 요청 body에서 `apiKey` 필드를 생략한다 (`hooks/useComponentGenerator.ts:26`). 빈 문자열을 보내도 서버는 env 키로 폴백하지만, 이 생략 패턴을 유지한다.
- 서버 에러는 `data.error`를 그대로 사용자에게 보여준다 (`hooks/useComponentGenerator.ts:32`, `App.tsx:128-133`). 사용자 메시지 가공은 서버에서 한다.
