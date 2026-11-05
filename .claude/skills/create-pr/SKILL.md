---
name: create-pr
description: |
  현재 브랜치의 커밋을 분석해 GitHub Pull Request를 생성한다. 서브 에이전트(fork)에서 실행되며, 프로젝트 성격에 따라 한국어/영문 PR 템플릿을 자동 선택한다(한국 프로젝트 → 한국어, 해외 오픈소스 → 영문).
  "PR 만들어줘", "PR 생성", "풀 리퀘스트 올려줘", "PR 올려줘", "리뷰 요청 올려줘", "create a PR", "open a pull request", "/create-pr" 같은 요청에 활성화한다.
  작업을 마치고 "이제 올려줘", "머지 요청 보내줘"처럼 PR을 의미하는 표현에도 사용한다. 커밋만 원하면 commit 스킬을, 리뷰 코멘트 반영은 autofix 스킬을 사용한다.
argument-hint: "[--lang ko|en] [--base <브랜치>] [--draft] [--dry-run] [추가 지시사항]"
context: fork
agent: general-purpose
---

# create-pr: 커밋 분석 후 PR 생성

현재 브랜치의 커밋과 diff를 분석해 PR 제목·본문을 작성하고 `gh pr create`로 PR을 생성한다.

이 스킬은 **fork된 서브 에이전트**에서 실행된다. 메인 대화 맥락이 없고 중간에 사용자에게 질문할 수 없으므로, 필요한 정보는 저장소에서 직접 수집하고, 스킬 호출 자체를 "현재 브랜치를 push하고 PR을 생성하라"는 명시적 요청으로 간주한다. 대신 아래 "중단 조건"에 걸리면 아무것도 push하지 않고 이유를 보고한 뒤 종료한다. 최종 응답은 메인 에이전트에게 전달되는 보고서이므로 마지막 "결과 보고" 형식을 지킨다.

## 인자

| 인자 | 의미 | 기본값 |
|------|------|--------|
| `--lang ko\|en` | 템플릿 언어 강제 지정 | 자동 판별 (Step 2) |
| `--base <브랜치>` | PR 대상 브랜치 | 원격 기본 브랜치 |
| `--draft` | Draft PR로 생성 | 일반 PR |
| `--dry-run` | push·PR 생성 없이 제목/본문 미리보기만 출력 | 꺼짐 |
| 나머지 텍스트 | 추가 지시사항 (예: "이슈 #12 연결", "리뷰어 @없이") | — |

## Step 0: 저장소 지침 로드

`CLAUDE.md` / `AGENTS.md`(루트 및 하위)를 읽어 커밋·PR 컨벤션, push 정책, 금지 사항을 확인한다. 프로젝트 지침이 이 스킬과 충돌하면 프로젝트 지침을 따른다.

## Step 1: 상태 수집

다음을 병렬로 실행한다.

```bash
git status --short
git branch --show-current
git remote -v
gh repo view --json nameWithOwner,defaultBranchRef,isFork,parent
gh pr view --json url,state 2>/dev/null   # 현재 브랜치에 이미 열린 PR이 있는지
```

- base 브랜치: `--base`가 없으면 `defaultBranchRef.name`. 저장소가 fork이고 `parent`가 있으면, 해외 오픈소스 기여일 가능성이 높으므로 upstream(`parent`)을 대상으로 PR을 만든다 (`gh pr create --repo <parent>`).
- PR에 포함될 커밋과 변경 파일:
  ```bash
  git fetch origin <base>
  git log --oneline origin/<base>..HEAD
  git diff --stat origin/<base>...HEAD
  git diff origin/<base>...HEAD
  ```
- diff가 크면 `--stat`으로 전체를 파악하고 핵심 파일만 읽는다. 본문 작성에 필요한 만큼만 읽으면 된다.

### 중단 조건 (push하지 않고 보고 후 종료)

- `origin/<base>..HEAD`에 커밋이 없음 → "PR로 보낼 커밋이 없습니다"
- 현재 브랜치에 이미 열린 PR이 있음 → 기존 PR URL을 보고 (중복 생성 금지. 새 커밋이 있으면 push만 하면 기존 PR에 반영된다고 안내)
- diff에 비밀 정보로 의심되는 값(실제 API 키, 토큰, 비밀번호, `.env` 파일 자체)이 포함됨
- merge/rebase 진행 중이거나 충돌 마커(`<<<<<<<`)가 남아 있음
- `gh auth status` 실패 (로그인 필요 → 사용자에게 `! gh auth login` 안내)

### 경고만 하고 진행

- 커밋되지 않은 변경이 있음 → PR에는 커밋된 내용만 포함된다. 직접 커밋하지 말고 보고서에 "미포함 변경 파일" 목록과 commit 스킬 사용 안내를 남긴다. 커밋 단위 판단은 사용자 몫이기 때문이다.

## Step 2: 템플릿 언어 결정

PR은 그 프로젝트의 리뷰어가 읽는 문서이므로, 리뷰어가 쓰는 언어를 따른다. 위에서부터 처음 결정되는 규칙을 적용한다.

1. **`--lang` 인자**가 있으면 그대로 사용한다.
2. **저장소 자체 PR 템플릿**이 있으면(`.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/PULL_REQUEST_TEMPLATE/*.md`, `docs/pull_request_template.md`) 그 템플릿의 구조와 언어를 그대로 따른다. 프로젝트가 정한 형식이 우리 템플릿보다 우선한다. 이 경우 references 템플릿은 작성 요령 참고용으로만 쓴다.
3. **프로젝트 신호**로 판별한다.
   - 최근 커밋 메시지(`git log --format=%s -20 origin/<base>`)에 한글이 과반 → 한국어
   - `README.md`, `CONTRIBUTING.md`, `AGENTS.md`의 본문 언어
   - `AGENTS.md`/`CLAUDE.md`에 "한국어로 작성" 같은 명시 규칙이 있으면 → 한국어
   - upstream이 해외 조직의 오픈소스(영문 README·영문 커밋 위주)면 → 영문
4. 신호가 엇갈리면 **base 브랜치의 최근 커밋 언어**를 따른다 — 리뷰어가 실제로 쓰는 언어를 가장 잘 반영하기 때문이다. 그래도 판단이 어려우면 한국어를 기본값으로 한다.

결정한 언어에 맞는 템플릿을 읽는다.

- 한국어 → [references/pr-template-ko.md](references/pr-template-ko.md)
- 영문 → [references/pr-template-en.md](references/pr-template-en.md)

## Step 3: 제목·본문 작성

### 제목

- 프로젝트 커밋 컨벤션을 따른다. 이 저장소처럼 `<type>: <요약>` 형식이면 PR 제목도 같은 형식을 쓴다.
- 커밋이 하나면 그 커밋 메시지 요약을 그대로 쓴다. 여러 개면 전체를 아우르는 목적으로 요약하고, type은 가장 주된 변경 기준으로 고른다 (feat > fix > refactor > chore).
- 한국어: 50자 이내, 명사형 종결("~추가", "~수정"), 마침표 없음.
- 영문: 72자 이내, 명령형 소문자 시작(`feat: add prompt length validation`), 마침표 없음.

### 본문

- 선택한 템플릿의 섹션 구조를 따르되, 내용이 없는 섹션은 빈 칸으로 남기지 말고 삭제한다 (단, "테스트" 섹션은 실행하지 않았다면 그 사실을 적는다 — 리뷰어가 검증 여부를 알아야 한다).
- **무엇을**은 diff에 이미 있으므로 짧게, **왜**와 **리뷰어가 봐야 할 지점**을 충실히 쓴다.
- 테스트 결과는 실제로 확인한 것만 적는다. 프로젝트 문서에 테스트/린트 명령이 있으면 실행해서 결과를 기입한다 (이 저장소는 `bun run test`, `bun run lint`). 실패하면 PR은 생성하되 본문과 보고서에 실패 사실을 명시하고 `--draft`로 생성한다 — 실패를 숨긴 PR은 리뷰어의 시간을 낭비시킨다.
- 추가 지시사항의 이슈 번호는 `Closes #N`(영문) / `관련 이슈: #N`(한국어)로 연결한다.
- 시스템/프로젝트에서 지정한 PR attribution 라인이 있으면 본문 끝에 붙인다.
- 본문에 API 키, 토큰, 내부 URL의 쿼리 파라미터 등 비밀 정보를 넣지 않는다.

## Step 4: push 및 PR 생성

`--dry-run`이면 이 단계를 건너뛰고 제목·본문만 보고한다.

1. **브랜치 준비**: 현재 브랜치가 base와 같으면(예: `master`에서 바로 작업) PR을 만들 수 없으므로, 현재 HEAD에서 새 브랜치를 만든다.
   - 이름: `<type>/<영문-kebab-요약>` (예: `feat/prompt-length-limit`)
   - `git switch -c <새 브랜치>` — 로컬 base 브랜치는 건드리지 않는다 (`reset` 금지). 보고서에 "로컬 `<base>`가 origin보다 앞서 있음"을 안내한다.
2. **push**: `git push -u origin <브랜치>`. `--force`는 사용하지 않는다. push가 거부되면(원격이 앞서 있음) 중단하고 보고한다.
3. **PR 생성**: 본문은 따옴표 이스케이프 문제를 피하기 위해 임시 파일로 전달한다.
   ```bash
   gh pr create --base <base> --head <브랜치> --title "<제목>" --body-file <임시파일> [--draft] [--repo <upstream>]
   ```
   upstream으로 보내는 경우 `--head <fork-owner>:<브랜치>` 형식을 쓴다. 생성 후 임시 파일은 삭제한다.
4. `gh pr view --json url,number,title,isDraft`로 생성 결과를 확인한다.

## 결과 보고

메인 에이전트가 사용자에게 그대로 전달할 수 있도록 아래 형식으로 응답한다. (보고서 자체는 판별된 언어와 상관없이 한국어로 작성한다.)

```
PR 생성 완료
- URL: https://github.com/<owner>/<repo>/pull/<N>
- 제목: <제목>
- 브랜치: <head> → <base> (Draft 여부)
- 템플릿: 한국어 | 영문 — <판별 근거 한 줄>
- 포함 커밋: N개
- 테스트: bun run test 통과 / bun run lint 통과 (또는 실패 내용)

참고
- <새 브랜치를 만들었다면 그 사실과 로컬 base 상태>
- <미포함 변경 파일이 있다면 목록>
```

중단했거나 `--dry-run`이면 첫 줄을 "PR 생성 중단: <이유>" 또는 "PR 미리보기 (dry-run)"로 바꾸고, dry-run은 제목과 본문 전체를 함께 보여준다.

## 금지 사항

- `git push --force`, `--amend`, `--no-verify`, `reset --hard`, 원격 브랜치 삭제
- 사용자 대신 커밋 생성 (커밋되지 않은 변경은 보고만 한다)
- 이미 열린 PR이 있는 브랜치에 새 PR 생성
- 리뷰어·라벨·assignee를 추가 지시 없이 임의 지정
