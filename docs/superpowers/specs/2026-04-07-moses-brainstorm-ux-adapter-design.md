# Moses Brainstorm UX Adapter Design

> Status: implemented on `moses-control-plane` for the `1.0.2` release line.

## 목적

이 문서는 Moses의 기존 control-plane 로직을 변경하지 않고, **초기 brainstorming / clarification 진입부에 환경별 UX adapter layer를 추가하는 설계**를 고정한다.

핵심 목표는 다음과 같다.

1. Moses의 planning / approval / orchestration / validation 로직은 유지한다.
2. 사용자는 현재 호스트 런타임이 제공하는 상호작용 방식에 맞는 더 쉬운 초기 UX를 받는다.
3. OpenCode처럼 구조화된 질문 도구가 있는 환경에서는 select-style UX를 사용한다.
4. 일반 CLI나 text-only 환경에서는 동일한 intent를 번호 선택 또는 짧은 다지선다 문장으로 표현한다.
5. UX adapter는 질문의 **표현 방식**만 바꾸고, Moses의 의사결정 로직과 승인 경계는 바꾸지 않는다.

이 설계는 Moses가 OpenCode 전용 agent에 머무르지 않고, 여러 host framework / runtime에 맞게 첫 사용자 경험을 적응시키는 얇은 compatibility layer를 갖도록 하는 데 목적이 있다.

---

## 비목표

이 설계가 의도적으로 하지 않는 일은 다음과 같다.

- planner / approval summary contract 변경
- 기존 clarification trigger 조건 변경
- worker routing 또는 orchestration policy 변경
- runtime별 bespoke business logic 추가
- 특정 framework 이름에 강하게 결합된 branching 확대
- 새로운 execution capability 추가

즉, 이번 변경은 **logic expansion**이 아니라 **UX adaptation**이다.

---

## 현재 상태 요약

현재 `src/templates/agent.md`는 `Planning-First Intake`와 `Clarification Interview Gate`를 통해 초기 사용자 상호작용을 제어한다.

현행 규칙의 핵심은 다음과 같다.

- substantive request는 discovery → classification → clarification 여부 판단 → short execution plan 순서로 진행한다.
- clarification interview는 non-trivial request이면서 ambiguity가 execution을 materially 바꿀 때만 실행한다.
- 질문은 기본적으로 `2-4 targeted questions max`, `one round by default`를 따른다.
- open-ended brainstorming보다는 confirmation-oriented questioning을 선호한다.
- 인터뷰는 마지막에 짧은 execution summary로 수렴해야 한다.

이 규칙은 이미 안정적이며, control-plane 설계와 잘 맞는다. 따라서 이번 설계의 삽입 지점은 **Clarification Interview Gate 앞단의 UX 표현층**이어야 한다.

---

## 핵심 제안

Moses의 맨 앞단에 `Brainstorm UX Adapter`라는 얇은 계층을 둔다.

이 adapter는 다음 질문에 답한다.

1. 현재 host runtime은 어떤 상호작용 도구를 제공하는가?
2. 이 요청은 초기 UX 지원이 필요한가?
3. 같은 intent를 이 환경에서 어떤 형식으로 제시하는 것이 가장 자연스러운가?

Adapter는 질문의 의미를 표준화하고, host별 표현 방식만 바꾼다.

예시:

- OpenCode + structured question tool 지원 → select-style prompt 사용
- Generic CLI + structured tool 미지원 → 번호 선택 + 자유입력 사용
- Text-only environment → 짧은 다지선다 문장 + 직접 입력 유도

이때 Moses 내부에서는 모두 같은 의미의 signal만 받는다.

예시 signal:

- `purpose_choice`
- `response_style_choice`
- `custom_input_present`
- `ux_mode_used`

이 signal은 기존 intake / clarification framing에 반영되지만, planner / approval / orchestration 로직을 새로 쓰게 만들지는 않는다.

---

## 설계 원칙

1. **Logic preserving**
   - UX adapter는 기존 판단 규칙을 바꾸지 않는다.
   - discovery, clarification trigger, approval boundary, orchestration path는 그대로 유지한다.

2. **Capability first, framework second**
   - adapter 선택은 가능하면 framework 이름보다 capability를 기준으로 한다.
   - 예: `supports_structured_question`, `supports_multi_option_choice`, `supports_custom_freeform_answer`.

3. **Thin adapter layer**
   - adapter는 질문의 표현을 담당한다.
   - 질문의 내용, approval policy, execution plan은 Moses 본체가 계속 책임진다.

4. **Graceful fallback**
   - capability 판단이 불확실하거나 structured UX가 실패하면 텍스트 기반 질문으로 안전하게 폴백한다.
   - UX adapter는 single point of failure가 되어서는 안 된다.

5. **Low user friction**
   - adapter는 질문 수를 늘리기 위한 장식이 아니다.
   - ambiguity를 더 빠르게 수렴시키는 경우에만 사용해야 한다.

---

## Adapter가 다루는 표준 인터랙션 의도

초기 버전에서는 adapter가 다음 두 가지 intent만 지원한다.

### 1. 목적 선택

사용자가 지금 대화에서 원하는 주 진입점을 빠르게 고르도록 돕는다.

권장 옵션 예시:

- 요구사항 정리
- 설계안 비교
- 실행 계획 수립
- 바로 설명 / 직접 입력

### 2. 응답 방식 선택

첫 번째 선택만으로 충분히 수렴되지 않을 때만, 사용자가 어떤 형태의 가이드를 원하는지 고르게 한다.

권장 옵션 예시:

- 간단히
- 단계별로
- 옵션 비교 형태로
- 직접 입력

이 두 intent는 UX adapter가 다루기에 충분히 일반적이고, host runtime이 달라도 동일한 의미를 유지하기 쉽다.

---

## 언제 Adapter를 실행하는가

Adapter는 모든 요청에서 무조건 실행되지 않는다.

### 실행 조건

다음이 모두 성립할 때 실행을 고려한다.

1. 요청이 non-trivial이다.
2. 초기 ambiguity가 존재한다.
3. 짧은 선택형 또는 다지선다 인터랙션이 수렴 속도를 높일 가능성이 높다.

### 건너뛰는 조건

다음 중 하나라도 성립하면 adapter를 건너뛴다.

- 사용자의 요청이 이미 충분히 구체적이다.
- 즉시 실행형 작업으로 바로 planning / delegation이 가능하다.
- trivial informational request다.
- host runtime capability가 너무 제한적이라 일반 텍스트 질문이 더 자연스럽다.

즉, adapter는 **필요할 때만 개입하는 UX assist**다.

---

## Capability 기반 호스트 분류

구현은 framework 이름에 의존할 수 있지만, 설계의 기준 모델은 capability다.

최소 capability flags 예시:

- `supports_structured_question`
- `supports_single_select`
- `supports_multi_select`
- `supports_custom_answer`
- `supports_multi_question_submission`
- `supports_text_only_prompt`

### 권장 adapter 선택 규칙

1. `supports_structured_question` + `supports_single_select` + `supports_custom_answer`
   - `StructuredSelectAdapter`

2. structured question은 없지만 text interaction은 안정적
   - `EnumeratedTextAdapter`

3. capability 판단 실패 또는 최소 환경
   - `MinimalTextFallbackAdapter`

OpenCode는 공식 문서상 `question` 도구가 `header`, `question`, `options`, `multiple`과 custom typed answer를 지원하므로 첫 번째 그룹에 속한다.

---

## 환경별 UX 표현 모델

### A. StructuredSelectAdapter

대상:

- OpenCode
- 또는 동등한 structured question / select UX를 제공하는 host

표현 방식:

- 목적 선택을 하나의 select question으로 제시
- 필요 시 응답 방식 선택을 두 번째 question으로 제시
- custom answer를 항상 허용해 사용자가 직접 맥락을 쓸 수 있게 함

주의점:

- 기본 preselect는 공식 동작으로 가정하지 않는다.
- 권장 옵션은 첫 번째 배치와 `(Recommended)` 라벨링으로 표현한다.

### B. EnumeratedTextAdapter

대상:

- 일반 CLI
- structured question API는 없지만 line-based text interaction은 충분한 환경

표현 방식:

- 번호 목록을 보여주고 하나를 선택하게 함
- 마지막 항목에 `직접 입력`을 둠
- 필요 시 두 번째 번호형 질문으로 응답 방식 선택

예시 형식:

```text
이번 대화에서 무엇이 가장 필요하신가요?
1) 요구사항 정리
2) 설계안 비교
3) 실행 계획 수립
4) 직접 입력
```

### C. MinimalTextFallbackAdapter

대상:

- text-only output 중심 환경
- 도구 사용이 불안정하거나 capability가 불명확한 환경

표현 방식:

- 한 문단 안에 짧은 다지선다 옵션을 제시
- 사용자가 그대로 답하거나 자유 입력하도록 유도

예시 형식:

```text
원하시는 방향을 골라 주세요: 요구사항 정리 / 설계안 비교 / 실행 계획 수립 / 직접 설명.
원하면 그대로 답하시고, 아니면 자유롭게 적어주셔도 됩니다.
```

---

## Moses 내부 데이터 흐름

Adapter가 추가되어도 내부 흐름은 다음처럼 단순해야 한다.

1. 사용자 요청 수신
2. discovery 수행
3. substantive / ambiguity 판단
4. 필요 시 host capability 평가
5. 적절한 UX adapter 선택
6. `purpose_choice`, 필요 시 `response_style_choice` 획득
7. intake summary에 반영
8. 기존 `Clarification Interview Gate`로 진입 또는 생략
9. execution summary → planner / approval summary → orchestration

중요한 점은 **adapter output이 plan source of truth가 아니라 intake signal**이라는 것이다.

예를 들어 사용자가 `설계안 비교`를 골랐더라도, 요청이 실제로는 단순 설명으로 충분하면 Moses는 그 선택을 참고만 하고 짧은 explanatory path로 수렴할 수 있어야 한다.

---

## 기존 로직과의 통합 방식

### `src/templates/agent.md`

주된 수정 지점은 다음 두 곳이다.

1. `Planning-First Intake`
   - 초기 ambiguity가 남을 때, host-appropriate UX adapter를 통해 bounded intake를 수행할 수 있다는 규칙을 추가한다.

2. `Clarification Interview Gate`
   - 기존 execution-oriented interview 규칙은 유지한다.
   - 다만 질문 표현 수단으로 structured select / numbered text / minimal text fallback을 사용할 수 있다고 명시한다.

### 유지되어야 하는 기존 규칙

- `2-4 targeted questions max`
- `one round by default`
- `Prefer confirmation questions over open-ended brainstorming`
- crisp execution summary로 마무리

즉, adapter는 clarification gate를 대체하지 않고, 그 앞단에서 **user-friendly bounded intake**를 제공한다.

---

## Planner 및 Approval Summary에 미치는 영향

planner의 contract는 그대로 유지한다.

변화는 다음 수준에 그친다.

- approval summary 작성 시, 사용자 선택 결과를 짧게 반영할 수 있다.
- 예: `You chose a design-comparison style intake, so I will present options before finalizing the plan.`

하지만 planner가 생성해야 하는 artifact 구조, 단계 구분, approval boundary, re-approval 조건은 바뀌지 않는다.

---

## 실패 처리와 폴백 규칙

### 1. Capability detection failure

- 보수적으로 text fallback 사용

### 2. Structured question tool failure

- 동일 intent를 번호형 또는 문장형 질문으로 재표현

### 3. User ignores options and types freeform input

- freeform input을 우선 해석
- adapter choice는 선택되지 않은 것으로 간주하고 일반 clarification 흐름으로 이어간다.

### 4. Adapter output is contradictory to request body

- 사용자 원문 요청을 더 높은 우선순위로 해석
- adapter output은 framing hint로만 사용한다.

이 규칙은 UX layer가 control-plane logic을 왜곡하지 않도록 보장한다.

---

## 검증 기준

이 설계가 올바르게 구현되었다고 주장하려면 최소한 다음이 성립해야 한다.

### 기능 검증

1. 모호한 non-trivial 요청에서는 host capability에 맞는 UX adapter가 선택된다.
2. 명확한 요청에서는 adapter가 건너뛰어지고 기존 흐름이 그대로 유지된다.
3. structured host와 text-only host가 다른 표면 UX를 사용해도, intake result는 동일 의미로 정규화된다.

### 로직 보존 검증

4. planner / approval / orchestration contract는 변경되지 않는다.
5. 기존 clarification gate의 bounded-question discipline은 유지된다.
6. adapter failure가 전체 flow failure로 이어지지 않는다.

### 예시 smoke scenarios

1. OpenCode-like host + vague request
   - structured select question이 나타나고, 결과가 intake summary에 반영된다.

2. generic CLI host + same vague request
   - 번호형 질문이 나타나고, 같은 intake meaning으로 정규화된다.

3. text-only host + same vague request
   - 문장형 다지선다가 나타나고, 같은 intake meaning으로 정규화된다.

4. precise implementation request
   - adapter가 실행되지 않고 기존 planning-first flow로 바로 진입한다.

---

## 구현 범위 제안

초기 구현 범위는 작게 유지하는 것이 좋다.

### Phase 1

- adapter 개념을 `src/templates/agent.md`에 반영
- OpenCode structured question path 정의
- generic numbered text fallback 정의
- minimal text fallback 정의

### Phase 2

- README 또는 docs에 host-aware UX behavior 간단 설명 추가
- runtime smoke test 시나리오 보강

### Phase 3 (선택)

- 다른 host framework 예시 추가
- richer capability matrix 문서화

초기 릴리스에서는 OpenCode + generic CLI + text fallback만 지원해도 충분하다.

---

## 리스크

1. **Overfitting to one host**
   - OpenCode 사례가 강하더라도 설계는 capability 중심을 유지해야 한다.

2. **Question inflation**
   - UX adapter가 질문 수를 늘리면 현재 bounded interview 원칙을 훼손한다.

3. **Confusing precedence**
   - adapter output과 자유 입력 요청 본문이 충돌할 때 우선순위가 모호하면 안 된다.

4. **Implementation leakage**
   - framework별 UX 세부사항이 Moses의 core decision logic에 스며들면 유지보수가 어려워진다.

---

## 최종 결정

Moses는 OpenCode 전용 select UX를 직접 하드코딩하지 않는다.

대신, **host runtime capability에 맞는 초기 brainstorming UX를 선택하는 `Brainstorm UX Adapter` layer**를 두고,
같은 intent를 다음 중 하나로 표현한다.

- structured select question
- enumerated text choice
- minimal text fallback

이 adapter는 초기 intake UX만 담당하며, 기존 control-plane logic, planner contract, approval boundary, orchestration policy는 그대로 유지한다.

이 설계는 Moses를 여러 framework / runtime에 이식 가능한 supervisor로 유지하면서도, host가 제공하는 UX affordance를 최대한 활용하는 방향이다.
