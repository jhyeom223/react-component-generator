# server/AGENTS.md

## Module Context

Bun 런타임 위에서 동작하는 AI API 프록시. 프론트의 `/api/*` 요청을 받아 Anthropic/Gemini를 호출하고, 응답을 react-live에서 실행 가능한 코드로 정규화해 반환한다.

## Tech Stack & Constraints

- HTTP 서버는 `Bun.serve`만 사용한다. Express 등 프레임워크를 추가하지 않는다.
- 외부 API는 SDK 없이 전역 `fetch`로 호출한다 (`index.ts:69`, `index.ts:101`).
- 환경 변수는 `process.env`로 읽는다. Bun이 `.env`를 자동 로드하므로 dotenv를 추가하지 않는다.
- 이 폴더는 `tsc -b` 대상이 아니다. 타입 안전성은 직접 확인해야 한다.

## Implementation Patterns

- 부수효과 없는 로직은 별도 파일로 분리한다: 응답 정규화는 `generator.ts`, 모델 폴백은 `fallback.ts`. `index.ts`는 라우팅과 외부 호출만 담당한다.
- 모든 응답에 `CORS_HEADERS`를 붙인다 (`index.ts:51`, 각 `Response.json` 호출). 새 라우트도 동일하게 한다.
- 응답 처리 순서는 `stripCodeFences` 후 `ensureRenderCall` (`index.ts:188`). 순서를 바꾸면 펜스가 남은 코드에 render가 주입된다.
- Gemini 모델 우선순위는 `GOOGLE_MODELS` 배열 순서로 정한다 (`index.ts:5`). 모델 추가는 배열만 수정한다.

## Testing Strategy

- 실행: 루트에서 `bun run test`. 파일명은 `*.test.ts`, 대상 모듈 옆에 둔다.
- 테스트는 `generator.ts`, `fallback.ts` 같은 순수 모듈을 직접 import한다. `index.ts`는 import 시 서버가 기동되므로 import 금지.
- 외부 호출이 필요한 로직은 `withModelFallback`처럼 콜백을 주입받는 형태로 만들어 `vi.fn`으로 대체한다 (`fallback.test.ts` 패턴).

## Local Golden Rules

- 에러 매핑은 메시지 문자열에 HTTP 상태 코드가 포함되는 것에 의존한다 (`index.ts:194`, `index.ts:201`). 제공자 호출에서 던지는 에러는 `... API error: ${response.status}` 형식을 유지한다 (`index.ts:85`, `index.ts:112`).
- 에러 메시지는 그대로 클라이언트에 노출된다 (`index.ts:209`). 키, 요청 URL, 응답 원문 전체를 메시지에 넣지 않는다.
- Asymmetry: Gemini 경로에만 모델 폴백(`index.ts:134-136`)과 `MAX_TOKENS` 잘림 감지(`index.ts:123`)가 있다. Anthropic은 단일 모델(`index.ts:77`)이며 `stop_reason` 검사가 없다. 제공자 동작을 맞추는 작업이면 이 차이를 함께 처리하고, 한쪽 수정이 다른 쪽에 적용되었다고 가정하지 않는다.
- 시스템 프롬프트의 JS 전용 규칙(`index.ts:20`), import 금지(`index.ts:11`), `render()` 호출 규칙(`index.ts:12`)은 프론트의 react-live `noInline` 실행 방식(`src/components/LivePreview.tsx:10`)에 맞춘 제약이다. 완화하지 않는다.
- `ensureRenderCall`은 대문자로 시작하는 첫 `const`/`function` 선언만 찾는다 (`generator.ts:19`). 정규식 변경 시 `generator.test.ts`의 경계 케이스를 유지한다.
