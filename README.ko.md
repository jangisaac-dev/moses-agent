# moses-agent

English version: [`README.md`](./README.md)

OpenCode 스타일 환경에서 재사용할 수 있는 Moses 오케스트레이터 에이전트 패키지입니다.

Moses를 로컬 OpenCode 에이전트 디렉터리에 설치한 뒤 세션을 다시 불러오고, `@moses`로 호출할 수 있습니다.

`moses-agent`는 Moses 프롬프트를 작고 검토 가능한 저장소 형태로 패키징하여, 버전 관리 하에 유지하고 여러 머신에 일관되게 설치하며, 불필요한 프로젝트 설정 없이 배포할 수 있게 해줍니다.

---

## 설치

### 요구 사항

- Node.js `>=18`
- 표준 OpenCode 스타일 에이전트 디렉터리를 사용하는 Unix 계열 환경

### 빠른 설치

```bash
git clone https://github.com/jangisaac-dev/moses-agent.git moses-agent && cd moses-agent && node bin/moses-install.js validate && ./install.sh
```

현재 기준으로 가장 쉬운 공식 설치 경로입니다.

`validate` 결과에서 기존 대상 파일이 unmanaged 상태이고 `forceRequiredForInstall` 값이 `true`라면, 바로 덮어쓰지 말고 먼저 상태를 확인하세요.

### 사람이 직접 설치할 때

가장 빠른 로컬 설치 순서:

```bash
git clone https://github.com/jangisaac-dev/moses-agent.git moses-agent
cd moses-agent
node bin/moses-install.js validate
./install.sh
```

설치 후 OpenCode 세션을 reload 또는 restart 하세요. 런타임이 `~/.config/opencode/agents`를 읽는다면 Moses를 `@moses`로 호출할 수 있습니다.

CLI를 직접 사용하고 싶다면:

```bash
node bin/moses-install.js install
```

설치 뒤 대상 경로와 관리 상태를 다시 확인하세요:

```bash
node bin/moses-install.js validate
```

### AI 에이전트에게 설치 맡기기

아래 프롬프트를 그대로 붙여 넣으면 됩니다:

```text
Clone https://github.com/jangisaac-dev/moses-agent.git into a local folder named moses-agent, read README.md and docs/installation.md, run `node bin/moses-install.js validate`, explain whether `forceRequiredForInstall` is true and why, and only if the target/path looks correct run `./install.sh`. After that, tell me the installed target path, whether a backup was created, and remind me to reload or restart OpenCode so `@moses` becomes available.
```

이 방식은 oh-my-opencode처럼 “AI 에이전트에게 구체적인 설치 작업을 맡기는” 흐름에 가깝게 만들면서도, 이 저장소가 실제로 지원하는 명령만 사용합니다.

### 기본 설치 대상

```text
~/.config/opencode/agents/moses.md
```

런타임이 다른 경로를 사용한다면 `--target`과 `--force`를 함께 사용하세요.

```bash
node bin/moses-install.js install --target "$HOME/.config/opencode/agents/moses.custom.md" --force
```

### 수동 설치

설치 CLI를 실행하고 싶지 않다면 [`docs/manual-install.md`](./docs/manual-install.md)의 수동 복사 절차를 사용하세요.

사람과 AI 에이전트 모두를 위한 전체 설치 가이드는 [`docs/installation.md`](./docs/installation.md)에서 볼 수 있습니다.

---

## 목차

- [설치](#설치)
- [이 패키지가 하는 일](#이-패키지가-하는-일)
- [누가 쓰면 좋은가](#누가-쓰면-좋은가)
- [v1.0.1 범위](#v101-범위)
- [의도적으로 제외한 범위](#의도적으로-제외한-범위)
- [저장소 구조](#저장소-구조)
- [지원하는 설치 모델](#지원하는-설치-모델)
- [빠른 시작](#빠른-시작)
- [CLI 명령](#cli-명령)
- [설치 동작 방식](#설치-동작-방식)
- [안전 모델](#안전-모델)
- [수동 설치](#수동-설치)
- [커스터마이징](#커스터마이징)
- [검증](#검증)
- [제거 동작](#제거-동작)
- [개발 메모](#개발-메모)
- [릴리즈 가이드](#릴리즈-가이드)
- [알려진 제한 사항](#알려진-제한-사항)
- [라이선스](#라이선스)

---

## 이 패키지가 하는 일

이 저장소는 단일 에이전트 파일을 설치하는 데 집중합니다.

- Moses 에이전트 프롬프트를 로컬 OpenCode 스타일 에이전트 디렉터리에 설치합니다.
- 기존 대상 파일을 교체하기 전에 백업을 만듭니다.
- 위험한 overwrite/remove 작업을 기본적으로 거부합니다.
- `--force`를 사용해 명시적인 사용자 의사 아래 커스텀 대상 설치를 지원합니다.
- 재사용 가능한 설치기, 셸 래퍼, 릴리즈 문서를 함께 제공합니다.

이 패키지는 의도적으로 작습니다. 플러그인, 훅 프레임워크, 대시보드, 런타임 확장 번들이 아닙니다.

## 누가 쓰면 좋은가

다음 목적이라면 `moses-agent`가 적합합니다.

- 재사용 가능한 Moses 오케스트레이터 프롬프트를 별도 저장소로 관리하고 싶을 때
- 여러 머신에 동일한 방식으로 설치하거나 재설치하고 싶을 때
- 설정 디렉터리에 쓰기 전에 설치 동작을 검토하고 싶을 때
- private/public GitHub 저장소 형태로 에이전트를 배포하고 싶을 때

## v1.0.1 범위

버전 `1.0.1`은 기능을 넓히기보다 핵심 설치 흐름에 집중합니다.

포함 사항:

- Moses 에이전트 템플릿
- Node 기반 설치 CLI
- 설치 / 제거용 셸 래퍼
- 덮어쓰기 전 백업 생성
- ownership / management marker 검사
- 명시적 `--force`와 함께 사용하는 커스텀 대상 지원
- 수동 설치 문서
- 릴리즈 준비 문서

## 의도적으로 제외한 범위

v1.0.1에 포함되지 않는 것:

- 에이전트 대상 파일 바깥의 OpenCode 설정 자동 수정
- plugin runtime hooks
- background services 또는 dashboards
- 자동 npm publish
- 패키지 내부에서 GitHub 저장소를 자동 생성하는 기능
- 자동 backup restoration
- 암호학적 설치 소유권 검증

## 저장소 구조

```text
moses-agent/
├── README.md
├── README.ko.md
├── LICENSE
├── .gitignore
├── package.json
├── install.sh
├── uninstall.sh
├── bin/
│   └── moses-install.js
├── src/
│   ├── installer/
│   │   ├── core.js
│   │   └── paths.js
│   └── templates/
│       └── agent.md
└── docs/
    ├── installation.md
    ├── manual-install.md
    └── release.md
```

## 지원하는 설치 모델

기본 설치 대상은 다음과 같습니다.

```text
~/.config/opencode/agents/moses.md
```

이 경로는 Unix 계열 환경에서 OpenCode 스타일 에이전트를 표준 설정 디렉터리에서 읽는 경우를 기준으로 한 기본 설치 위치입니다.

런타임이 다른 경로를 사용한다면 `--target --force`로 설치할 수 있지만, 실제로 그 위치를 런타임이 읽는지는 사용자가 확인해야 합니다.

## 빠른 시작

### 옵션 A — 셸 래퍼

```bash
git clone https://github.com/jangisaac-dev/moses-agent.git moses-agent
cd moses-agent
./install.sh
```

### 옵션 B — Node CLI

```bash
node bin/moses-install.js install
```

### 먼저 검증하기

```bash
node bin/moses-install.js validate
```

### 커스텀 대상에 설치하기

```bash
node bin/moses-install.js install --target "$HOME/.config/opencode/agents/moses.custom.md" --force
```

설치 후 OpenCode 세션을 reload 또는 restart 하여 런타임이 에이전트 디렉터리를 다시 읽도록 하세요. 호스트 런타임이 설치된 파일을 읽으면 Moses를 `@moses`로 호출할 수 있습니다.

## CLI 명령

```bash
node bin/moses-install.js help
node bin/moses-install.js validate
node bin/moses-install.js install
node bin/moses-install.js install --target "$HOME/.config/opencode/agents/moses.custom.md" --force
node bin/moses-install.js uninstall
node bin/moses-install.js uninstall --target "$HOME/.config/opencode/agents/moses.custom.md" --force
```

## 설치 동작 방식

설치 시 CLI는 다음 순서로 동작합니다.

1. 번들된 템플릿 경로를 확인합니다.
2. 대상 경로를 확인합니다.
3. 필요하면 상위 디렉터리를 만듭니다.
4. 대상 파일이 `moses-agent`가 관리하는 파일인지 검사합니다.
5. 대상 파일이 이미 있으면 타임스탬프가 붙은 백업을 만듭니다.
6. Moses 템플릿을 대상 경로에 씁니다.
7. 결과를 구조화된 JSON으로 출력합니다.

기존 대상 파일이 `moses-agent` 관리 파일로 보이지 않으면, `--force` 없이 덮어쓰지 않습니다.

## 안전 모델

설치기는 보수적으로 동작하도록 설계되어 있습니다.

### 기본 대상 안전성

- 기본 대상 설치는 `--force` 없이 허용됩니다.
- 기존 파일은 교체 전에 백업됩니다.

### 비기본 대상 안전성

- 비기본 대상은 항상 `--force`가 필요합니다.
- 이를 통해 관련 없는 파일이나 디렉터리에 우발적으로 쓰는 일을 줄입니다.

### 관리 파일 감지

번들된 템플릿에는 다음 marker가 포함됩니다.

```html
<!-- moses-agent:managed -->
```

이 marker를 통해 CLI는 패키지가 관리하는 파일과 그렇지 않은 파일을 구분합니다.

### unmanaged 파일 보호

- install은 기본적으로 unmanaged 파일을 덮어쓰지 않습니다.
- uninstall은 기본적으로 unmanaged 파일을 삭제하지 않습니다.

이 검사는 `--force`로 우회할 수 있지만, 그때는 명시적인 운영자 판단이 필요합니다.

## 수동 설치

CLI를 쓰고 싶지 않다면 다음 문서를 참고하세요.

- [`docs/manual-install.md`](./docs/manual-install.md)

수동 설치는 감사를 중시하는 환경, 패키징 실험, 또는 셸 래퍼 사용을 원하지 않는 상황에 유용합니다.

## 커스터마이징

가장 단순하게 지원하는 커스터마이징 경로는 다음과 같습니다.

1. `src/templates/agent.md`를 수정합니다.
2. 저장소를 로컬에서 검증합니다.
3. 원하는 대상에 다시 설치합니다.

여러 변형을 관리한다면 명시적인 커스텀 대상을 사용해 주 설치본을 실수로 덮어쓰지 않도록 하세요.

## 검증

내장 validator는 다음 정보를 보고합니다.

- repository root
- template path
- template presence
- managed marker presence
- target path
- target directory existence
- target existence
- 기본 경로 여부
- target이 managed 상태로 보이는지 여부
- install 또는 uninstall에 `--force`가 필요한지 여부

예시:

```bash
node bin/moses-install.js validate
```

이 validator는 경로와 ownership 상태를 점검하는 도구입니다. 모든 OpenCode 배포판이나 모든 커스텀 설정 레이아웃에서의 완전한 호환성을 보장하는 것은 아닙니다.

## 제거 동작

uninstall 명령은 다음과 같이 동작합니다.

- 대상 파일 존재 여부를 확인합니다.
- 기본적으로 unmanaged 대상을 제거하지 않습니다.
- 비기본 대상에는 `--force`를 요구합니다.
- 안전 규칙이 허용할 때만 파일을 제거합니다.

백업은 자동으로 복원하지 않습니다. 여러 백업 후보가 존재할 수 있어 자동 선택은 위험할 수 있으므로, v1.0.1에서도 복원은 수동 처리입니다.

제거 후 OpenCode 세션을 reload 또는 restart 하세요. 관련 대상 경로에 대체 에이전트 파일이 없다면 `@moses`를 더 이상 사용할 수 없어야 합니다.

## 개발 메모

유용한 로컬 명령:

```bash
node bin/moses-install.js help
node bin/moses-install.js validate
node bin/moses-install.js install --target "$PWD/tmp/moses-test.md" --force
node bin/moses-install.js uninstall --target "$PWD/tmp/moses-test.md" --force
```

## 릴리즈 가이드

이 저장소를 배포하기 전에 다음을 확인하세요.

1. 문서가 실제 CLI 동작과 일치하는지
2. unmanaged 파일에 대한 overwrite 거부가 동작하는지
3. unmanaged 파일에 대한 uninstall 거부가 동작하는지
4. `--force`를 사용하는 custom-target 동작이 맞는지
5. `package.json`의 저장소 메타데이터가 실제 GitHub 저장소와 일치하는지
6. 개인 로컬 경로나 비밀 정보가 남아 있지 않은지

릴리즈 노트와 체크리스트 세부사항은 다음 문서에 있습니다.

- [`docs/release.md`](./docs/release.md)

## 알려진 제한 사항

- 기본 설치 동작은 표준 config path를 사용하는 Unix 계열 환경을 기준으로 합니다.
- ownership detection은 marker 기반이며 cryptographic verification은 아닙니다.
- 이 패키지는 단일 agent 파일만 관리하며 broader runtime configuration은 다루지 않습니다.
- backup restoration은 수동입니다.
- Full CI와 cross-platform coverage는 v1.0.1에 포함되지 않습니다.

## 라이선스

MIT
