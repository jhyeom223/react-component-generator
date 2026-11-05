# AGENTS.md

## Operational Commands

- 패키지 매니저는 `bun` 고정. npm/yarn/pnpm 사용 금지 (lockfile은 `bun.lock` 단일).
- 설치: `bun install`
- 개발 실행(API + Vite 동시): `bun run dev`
- API 서버만: `bun run server` (port 3002, watch 모드)
- 테스트: `bun run test` (Vitest 1회 실행). `bun test`는 Bun 내장 러너라 jsdom/setup 파일이 적용되지 않으므로 사용 금지.
- 테스트 watch: `bun run test:watch`
- 타입체크 + 빌드: `bun run build`
- 린트: `bun run lint`
- 작업 완료 전 `bun run test`와 `bun run lint`를 통과시킨다.
- 코드(`src/`, `server/`)를 생성·수정했다면, 테스트·린트 통과 후 사용자에게 완료를 보고하기 전에 `evaluator` 서브 에이전트(`.claude/agents/evaluator.md`)를 호출한다. prompt에는 요구사항 원문, 변경 파일 목록, 테스트·린트 결과를 넣는다. 판정이 FAIL이면 결함을 고치고(버그 재현 테스트부터) 다시 호출하며, PASS 전에는 완료로 보고하지 않는다. 문서·설정만 바꾼 경우는 생략한다.

## Golden Rules

### Immutable

- API 키는 서버 밖으로 내보내지 않는다. `/api/config`는 키 존재 여부(boolean)만 반환한다 (`server/index.ts:148-153`). 응답, 에러 메시지, 로그에 키 값이나 Gemini 요청 URL(쿼리에 `key=` 포함, `server/index.ts:99`)을 넣지 않는다.
- `.env`는 커밋하지 않는다 (`.gitignore`에 등록됨). 키를 코드에 하드코딩하지 않는다.
- 클라이언트 입력 키가 `.env` 키보다 우선한다 (`server/index.ts:65`). 이 우선순위를 바꾸면 UI 안내 문구(`src/App.tsx:120`)도 함께 수정한다.

### Sensitive Files (에이전트 접근 금지)

- 민감 파일은 읽지도, 수정하지도, 생성하지도 않는다. 대상: `.env`, `.env.*`(`.env.example` 포함), `.envrc`, 이름에 `secret`/`credential`이 들어간 파일, `*.pem`/`*.key`/`*.p12`/`*.pfx`/`*.jks`/`*.keystore`, SSH 키(`id_rsa*`, `id_ed25519*`), `.npmrc`/`.netrc`/`.git-credentials`, 홈의 `~/.ssh`, `~/.aws`, `~/.azure`, `~/.config/gcloud`, `~/.docker/config.json`, `~/.kube/config`.
- 이 규칙은 `.claude/settings.json`의 `permissions.deny`로 강제된다. 규칙 문서와 deny 목록은 함께 유지하며, 한쪽만 바꾸지 않는다.
- 셸로 우회하지 않는다. `bun -e`/`node -e`의 파일 읽기, `sed`/`awk`/`cp`/`git show`/`git diff`, 환경변수 덤프(`printenv`, `env`, `Get-ChildItem Env:`) 등 deny 패턴에 걸리지 않는 방법으로 내용을 보거나 옮기는 것도 금지다.
- 접근이 거부되면 다른 방법을 시도하지 않고, 필요한 정보를 사용자에게 요청한다. 필요한 환경변수 이름은 `.env`가 아니라 코드(`ENV_KEYS`, `server/index.ts:59`)에서 확인한다.
- `permissions.deny` 목록은 사용자의 명시적 요청 없이 삭제하거나 완화하지 않는다.

### Cross-Boundary Sync (FE/BE 동시 수정 필수)

- `Provider` 타입이 양쪽에 중복 정의되어 있다: `src/types/index.ts:1`, `server/index.ts:57`. 제공자 추가/변경 시 `ENV_KEYS`(`server/index.ts:59`), `PROVIDER_CONFIG`(`src/App.tsx:8`)까지 4곳을 함께 수정한다.
- API 포트 3002는 `server/index.ts:139`와 Vite proxy(`vite.config.ts:9-12`) 두 곳에 있다. 하나만 바꾸지 않는다.
- 프론트는 항상 상대 경로 `/api/*`로 호출한다 (`src/App.tsx:25`, `src/hooks/useComponentGenerator.ts:23`). 절대 URL(`http://localhost:3002`)을 쓰지 않는다.

### Double Defense (한쪽을 제거하지 말 것)

- 빈 프롬프트: 클라이언트 버튼 비활성화/trim 검사(`src/components/PromptInput.tsx:22,49`)와 서버 400 응답(`server/index.ts:176`).
- API 키 누락: 클라이언트 alert(`src/App.tsx:35`)와 서버 400 응답(`server/index.ts:169`).
- 생성 코드 형식: 시스템 프롬프트 지시(`server/index.ts:12,16`)와 후처리(`server/generator.ts`의 `stripCodeFences`, `ensureRenderCall`). 프롬프트를 고쳐도 후처리는 유지한다.

### Test Boundary

- 테스트는 부수효과 없는 순수 모듈에만 존재한다 (`server/generator.test.ts`, `server/fallback.test.ts`, `src/components/PromptInput.test.tsx`). `server/index.ts`는 `Bun.serve`를 import 시점에 실행하므로 테스트에서 import하지 않는다.
- 새 로직은 순수 함수로 분리해 별도 파일에 두고 테스트를 추가한다 (`server/generator.ts:1-2` 주석의 패턴).
- 테스트 파일은 `src/**/*.test.{ts,tsx}` 또는 `server/**/*.test.ts` 위치여야 수집된다 (`vite.config.ts:20`).

### Hard Constraint

- `server/`는 `tsc -b` 타입체크 대상이 아니다 (`tsconfig.app.json`은 `src`만, `tsconfig.node.json`은 `vite.config.ts`만 포함). 서버 타입 오류는 빌드로 잡히지 않으므로 수정 후 `bun run server` 실행과 테스트로 확인한다.

## Project Context

- 자연어 프롬프트로 React 컴포넌트를 생성하고 브라우저에서 즉시 렌더링하는 도구.
- Stack: React 19, TypeScript 5.9, Vite 8, Bun(API 서버), react-live 4, Vitest 4 + Testing Library + jsdom, ESLint 9.
- 외부 AI: Anthropic Messages API, Google Gemini API (SDK 없이 `fetch` 직접 호출).

## Standards & References

- 실행 방법과 기능 소개는 `README.md` 참조. 여기서 반복하지 않는다.
- 코드 주석과 사용자 노출 메시지는 한국어로 작성한다 (기존 코드 기준).
- 커밋 메시지: `<type>: <한국어 요약>`, type은 `feat` / `fix` / `refactor` / `chore`. 상세 규칙은 `.claude/skills/commit/SKILL.md`.
- push, `--amend`, `--no-verify`는 명시적 요청 없이 사용하지 않는다.
- Maintenance Policy: 이 문서의 규칙이나 근거 라인이 실제 코드와 어긋나면 작업 중 즉시 알리고 업데이트를 제안한다.

## Context Map

- **[API 서버 수정 (Bun)](./server/AGENTS.md)** — AI 제공자 호출, 프롬프트, 응답 후처리, 에러 매핑 작업 시.
- **[프론트엔드 UI 수정 (React)](./src/AGENTS.md)** — 컴포넌트, 훅, 미리보기, 스타일 작업 시.
