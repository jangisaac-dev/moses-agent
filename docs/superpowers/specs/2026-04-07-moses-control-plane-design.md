# Moses Control Plane Design

## 목적

이 문서는 Moses를 단순한 supervisor가 아니라 **planner / orchestrator / communicator 전용 control plane**으로 재정의하기 위한 설계안을 고정한다.

핵심 목표는 다음과 같다.

1. 사용자는 항상 Moses하고만 대화한다.
2. Moses는 직접 구현, 셸 실행, 테스트 실행, 파일 수정 같은 실무를 수행하지 않는다.
3. Moses는 planning 단계에서 **subagent 배치**, **skill 사용 계획**, **승인 범위**, **검증 기준**을 먼저 사용자에게 설명하고 승인받는다.
4. 승인 후에는 Moses가 내부 상세 플랜을 기준으로 bundled subagents를 오케스트레이션한다.
5. 실제 코드 작성, 글 작성, 테스트 실행 같은 최하위 실무는 **저비용 / 저성능 worker도 실패하지 않도록 매우 상세한 delegation packet**과 함께 내려보낸다.

이 설계는 Superpowers의 workflow discipline, oh-my-opencode류 하네스의 orchestration 감각, 그리고 현재 `moses-agent`의 bundled subagent 구조를 결합한다.

---

## 설계 원칙

1. **Moses 단일 사용자 인터페이스**
   - 사용자는 internal worker와 직접 대화하지 않는다.
   - 모든 내부 결과는 Moses가 병합하고 요약해 전달한다.

2. **Strong design / plan gate**
   - 의미 있는 작업은 brainstorming / planning / approval을 거친 뒤에만 실행된다.
   - 승인 전에는 실행형 skill 또는 execution worker를 호출하지 않는다.

3. **One-time plan approval**
   - 사용자는 계획 전체를 한 번 승인한다.
   - 승인 범위 안에서는 Moses가 내부 단계를 자동 진행한다.
   - 범위를 벗어나거나 위험 프로파일이 바뀌면 재승인을 요청한다.

4. **Internal detailed planning, external medium-detail reporting**
   - 내부에서는 완전 상세한 planning artifact를 유지한다.
   - 사용자에게는 중간 밀도의 승인용 plan summary만 보여준다.

5. **Bundled core subagents first**
   - planner / explorer / librarian / implementer / reviewer / validator / runner는 Moses 프로젝트에 번들된 기본 팀으로 취급한다.
   - discovery는 core subagents의 존재 여부를 찾는 용도가 아니라, **skills / tools / MCPs / 추가 capability**를 파악하는 용도다.

6. **High-trust control plane, low-trust leaf workers**
   - 상위 계층은 강한 판단과 오케스트레이션을 담당한다.
   - 최하위 worker는 저렴한 모델일 수 있다고 가정한다.
   - 따라서 leaf worker에게는 추론을 요구하는 대신, 상세한 packet과 강한 완료 조건을 제공한다.

---

## 역할 경계

### Moses가 하는 일

- 사용자 요청 해석
- discovery 결과 병합
- clarifying question 진행
- workflow 선택
- skill 사용 계획 수립 및 보고
- internal detailed plan 생성 / 유지
- user-facing approval summary 작성
- subagent dispatch
- worker result 병합
- 승인 범위 준수 여부 판단
- 다음 단계 결정
- 최종 completion report 전달

### Moses가 하지 않는 일

- 직접 코드 수정
- 직접 셸 실행
- 직접 테스트 / 빌드 / 설치 실행
- 직접 파일 생성 / 삭제 / 변경
- 직접 acceptance work 수행
- 구현 worker를 겸하는 행동

이 경계는 prompt contract 차원에서 강하게 유지되어야 하며, 런타임이 허용한다면 planner / orchestrator 쪽 tool permission도 제한하는 것이 바람직하다.

---

## Control Plane vs Core Subagents

### Control Plane

Moses는 user-facing control plane이다. Moses는 전체 lifecycle을 관리하며, 내부 팀이 무엇을 언제 어떤 packet으로 수행할지 결정한다.

### Bundled Core Subagents

Moses는 다음 bundled core subagents를 기본 팀으로 사용한다.

- `moses-planner`
- `moses-explorer`
- `moses-librarian`
- `moses-implementer`
- `moses-reviewer`
- `moses-validator`
- `moses-runner`

이들은 discovery 결과에 의존해 "존재 여부"를 판단하는 대상이 아니다. 항상 존재하는 내부 팀이며, Moses는 현재 작업에 어떤 subagent를 투입할지만 결정한다.

### Discovery가 찾는 것

- applicable skills
- available tools
- available MCP servers
- runtime capability constraints
- 작업에 사용할 수 있는 추가 routing path

### Discovery가 찾지 않는 것

- bundled core subagents의 존재 여부

---

## 계층형 실행 구조

이 설계는 명시적으로 3계층 구조를 가정한다.

### Layer 1 — Moses

- 사용자와만 대화
- 승인 범위 관리
- lifecycle orchestration
- 결과 병합 및 보고

### Layer 2 — Specialist Subagents

- planner
- explorer
- librarian
- implementer-coordinator 성격의 implementer
- reviewer
- validator
- runner

이 계층의 가장 중요한 책임은 **자기 아래로 내려가는 실무 작업이 실패하지 않도록 context를 정제하고, task를 더 작게 분해하며, leaf worker용 delegation packet을 상세하게 작성하는 것**이다.

### Layer 3 — Leaf Workers

이 계층은 실제 실무를 수행한다.

예시:

- 코드 작성
- 문서 / 글 작성
- 테스트 실행
- 제한된 셸 작업
- 단일 파일 수정
- 좁은 범위 리서치 보조

이 계층은 저비용 / 저성능 모델이어도 된다고 가정한다. 따라서 상위 계층은 leaf worker가 큰 추론 없이도 실행할 수 있도록 지시를 최대한 구체화해야 한다.

---

## 권장 Lifecycle

### 1. Discovery

Moses는 현재 런타임에서 사용 가능한 다음 요소를 파악한다.

- agents
- skills
- tools
- MCPs
- permissions / approval constraints

이 단계의 목적은 단순 inventory가 아니라, **이번 작업에 실제로 사용할 orchestration path를 정리하는 것**이다.

### 2. Clarification

- 필요한 경우 한 번에 하나의 질문만 한다.
- 질문은 실행 가능 계획을 만들기 위한 정보 확보를 목적으로 한다.
- design gate가 필요한 작업은 여기서 설계를 정리한다.

### 3. Planning

Moses는 planning 단계에서 두 개의 산출물을 만든다.

1. internal detailed planning artifact
2. user-facing medium-detail approval summary

이 단계에서 Moses는 다음을 확정해야 한다.

- 단계 목록
- 단계별 owner subagent
- 단계별 skill 사용 계획
- verification strategy
- 승인 범위
- 재승인 조건

### 4. Approval Gate

사용자에게는 다음이 포함된 medium-detail 요약을 보여준다.

- 작업 목표
- 단계 요약
- 단계별 담당 subagent
- 단계별 적용 skill
- 자동 진행 범위
- 재승인 조건
- 완료 판단 기준

사용자가 한 번 승인하면, Moses는 승인 범위 내에서 내부 단계를 자동 진행한다.

### 5. Orchestration

승인 후 Moses는 internal detailed plan을 기준으로 subagent들을 dispatch한다.

- 순차 / 병렬 수행 결정
- leaf worker용 packet 생성 및 하향 전달
- worker result 수집
- 결과 병합 후 다음 단계 판단

### 6. Review / Validation

구현 및 실무 작업 뒤에는 반드시 review / validation gate를 거친다.

- reviewer: 품질 / 설계 일치성 / scope drift 점검
- validator: 검증 근거 / 완료 주장 가능 여부 / evidence sufficiency 점검

### 7. Refactor / Cleanup Pass

필요한 경우 승인된 범위 안에서 cleanup 또는 bounded refactor를 수행한다. 이 단계는 구현 후에 존재하지만, 기능 확장이나 새 목표 추가로 변질되어서는 안 된다.

### 8. Completion Gate

Moses는 최종 보고 시 다음을 명시한다.

- 무엇이 완료되었는가
- 어떤 evidence로 완료를 주장하는가
- 어떤 subagent / skill path를 사용했는가
- 남은 리스크는 무엇인가
- 승인 범위를 벗어나지 않았는가

---

## Internal Detailed Planning Artifact

Internal planning artifact는 Moses orchestration의 source of truth다. 사용자에게 항상 전체를 노출할 필요는 없지만, 내부 실행은 이 아티팩트를 기준으로 이루어져야 한다.

### 권장 상위 필드

- `task_identity`
- `constraints`
- `non_goals`
- `approval_boundary`
- `discovery_snapshot`
- `execution_strategy`
- `stages`
- `gates`
- `change_control`
- `final_success_criteria`

### Stage 단위 필드

각 stage는 최소한 다음 필드를 가져야 한다.

- `stage_id`
- `name`
- `objective`
- `owner_subagent`
- `skills_to_apply`
- `tools_or_mcps`
- `input_context`
- `actions_expected`
- `deliverables`
- `verification`
- `depends_on`
- `retry_policy`
- `escalation_condition`
- `approval_impact`
- `leaf_worker_packet_requirements`

### Stage 설계 원칙

각 stage는 아래 질문에 답할 수 있어야 한다.

1. 이 단계는 무엇을 끝내기 위한 단계인가?
2. 누가 owner인가?
3. 어떤 skill이 적용되는가?
4. 어떤 evidence가 있어야 다음 단계로 넘어갈 수 있는가?
5. leaf worker에게 무엇을 넘겨야 실패하지 않는가?
6. 이 단계 수행이 승인 범위를 바꾸는가?

---

## User-Facing Approval Summary

사용자 승인 요약은 medium-detail을 유지해야 한다. 너무 얕아도 안 되고, internal planning artifact 전체를 복사해서도 안 된다.

### 권장 포함 항목

- 이번 작업 목표
- 진행 단계 요약
- 각 단계 담당 subagent
- 각 단계 적용 skill과 이유
- 자동 진행 범위
- 재승인 조건
- 완료 판단 기준

### 의도

사용자는 Moses 내부 구현 세부를 모두 볼 필요는 없지만, 적어도 다음은 이해할 수 있어야 한다.

- 어떤 흐름으로 진행되는지
- 어떤 subagent 팀이 투입되는지
- 어떤 skill이 어디서 왜 쓰이는지
- 어떤 경계 안에서 Moses가 자율 진행하는지

---

## Skill Planning and Reporting

Moses는 planning 단계에서 applicable skills를 반드시 확인하고, 사용자에게 **어디에 어떤 skill을 왜 쓸지** 설명해야 한다.

### Skill report 최소 항목

- skill 이름
- 적용 단계
- 적용 이유
- 실행 주체(subagent)
- 필수 / 선택 여부

### 예시

- `brainstorming`
  - 적용 단계: 설계 확정
  - 이유: 구현 전 설계 승인 강제
  - 실행 주체: Moses / planner
- `writing-plans`
  - 적용 단계: 설계 승인 이후
  - 이유: 실행 가능한 plan artifact 생성
  - 실행 주체: planner
- `test-driven-development`
  - 적용 단계: 구현 단계
  - 이유: 변경 안정성 강화
  - 실행 주체: implementer 또는 implementer-coordinator
- `verification-before-completion`
  - 적용 단계: 완료 직전
  - 이유: fresh verification evidence 확보
  - 실행 주체: validator 중심

Skill selection은 planner가 계산하되, reporting responsibility는 Moses가 진다.

---

## Detailed Delegation Contracts for Cheap Workers

이 설계의 핵심 제약 중 하나는 **최하위 worker에 저비용 모델을 사용할 수 있다**는 점이다. 따라서 모든 downstream delegation은 "worker가 똑똑하겠지"를 전제로 해서는 안 된다.

### 정책 문장

All downstream work delegated to leaf workers MUST be accompanied by a highly explicit execution packet that minimizes reliance on model inference. The system MUST assume cheap, low-capability workers and therefore push context selection, scope control, step sequencing, output formatting, and verification instructions upward into the delegating subagent layer.

### 의미

- leaf worker는 넓은 맥락 추론을 잘하지 못한다고 가정한다.
- leaf worker는 숨은 의도를 읽어내지 못한다고 가정한다.
- leaf worker는 애매한 요구를 스스로 보정하지 못한다고 가정한다.
- 그러므로 상위 계층이 먼저 작업을 구체화해야 한다.

### Leaf Worker Delegation Packet 필수 필드

- `TASK`
- `GOAL`
- `SCOPE`
- `FILES_TO_READ`
- `FILES_TO_MODIFY`
- `FILES_TO_AVOID`
- `STEP_BY_STEP_INSTRUCTIONS`
- `OUTPUT_FORMAT`
- `VERIFICATION_STEPS`
- `MUST_DO`
- `MUST_NOT_DO`
- `STOP_AND_REPORT_IF`
- `DONE_WHEN`

### 권장 추가 필드

- `EXAMPLES`
- `PATTERN_REFERENCE`
- `ASSUMPTIONS_ALLOWED`
- `ASSUMPTIONS_FORBIDDEN`
- `DEPENDENCY_CONTEXT`
- `RETURN_SCHEMA`

### Delegating Subagent 책임

상위 subagent는 단순히 "이거 해"라고 넘겨서는 안 된다. 최소한 다음을 책임져야 한다.

1. 필요한 context만 선별해서 내려보낼 것
2. 수정 범위와 금지 범위를 명확히 적을 것
3. 작업 순서를 번호로 적을 것
4. 검증 명령과 통과 기준을 적을 것
5. worker가 추측하면 안 되는 지점을 명시할 것
6. 막히는 조건을 정의할 것
7. 결과 반환 형식을 고정할 것

### Leaf Worker 동작 원칙

leaf worker는 autonomy가 높은 탐색형 agent가 아니라, **정밀 작업기**에 가깝게 취급한다.

- 입력된 packet 범위를 벗어나지 않는다.
- 모호하면 추측하지 않고 blocker로 올린다.
- 정해진 출력 형식을 유지한다.
- 지정된 verification만 우선 수행한다.
- 자체적으로 목표를 확장하지 않는다.

---

## Review and Validation Gates

### Reviewer 역할

- 구현 품질 검토
- 설계와 구현의 일치 여부 확인
- scope drift 탐지
- bounded refactor 필요성 판단

### Validator 역할

- 검증 증거 확인
- 테스트 / 빌드 / 진단 결과의 sufficiency 평가
- 완료 주장 가능 여부 판정
- 누락된 검증 또는 약한 evidence 식별

### Completion 직전 규칙

review와 validation은 옵션이 아니라, completion gate의 일부여야 한다. 의미 있는 구현 결과는 reviewer와 validator를 모두 거쳐야 한다.

---

## Approval Boundary and Change Control

### 자동 진행 가능한 경우

- 승인된 목표 안에서만 움직일 때
- 승인된 단계 구조를 유지할 때
- 새로운 핵심 skill / subagent 전략이 필요하지 않을 때
- 산출물 형식이 유지될 때
- 검증 방식이 본래 계획과 크게 다르지 않을 때

### 재승인이 필요한 경우

- 목표가 바뀔 때
- 범위가 확장될 때
- 위험 수준이 높아질 때
- 승인되지 않은 대형 refactor가 필요할 때
- 핵심 worker / skill routing이 바뀔 때
- 완료 기준 자체가 달라질 때

---

## 기존 Repository 구조와의 연결

이 설계는 새 역할을 대량 추가하는 방향이 아니라, 기존 repo 구조를 더 강한 contract 중심으로 재정렬하는 방향을 따른다.

### `src/templates/agent.md`

다음을 강하게 선언하는 최상위 헌장이 된다.

- Moses = planner / orchestrator / communicator only
- workflow selection before execution
- internal detailed plan + external approval summary 분리
- bundled subagent 활용 원칙
- skill reporting duty
- approval / change-control rules
- worker result merge transaction

### `src/templates/moses-planner.md`

planner는 다음의 primary owner가 된다.

- internal detailed planning artifact 작성
- user-facing approval summary 생성
- stage별 owner / skill / verification / retry 정의
- leaf worker packet 설계 기준 제공

### `src/templates/moses-explorer.md` / `moses-librarian.md`

이들은 leaf worker가 이해할 수 있도록 context와 evidence를 정제하는 역할을 강화해야 한다.

### `src/templates/moses-implementer.md`

implementer는 직접 수정만 하는 존재가 아니라, 필요시 cheaper leaf worker에게 상세 packet을 작성해 위임할 수 있는 coordinator 성격을 포함해야 한다.

### `src/templates/moses-reviewer.md` / `moses-validator.md`

이들은 post-processing 옵션이 아니라 필수 gate로 취급된다.

---

## 비목표

이 설계는 다음을 약속하지 않는다.

- 런타임이 지원하지 않는 강제 sandbox / rollback / session manager 제공
- core bundled team 바깥의 무제한 agent registry를 전제한 구조
- Moses 자신의 direct execution 복귀
- 모호한 작업을 leaf worker가 자율적으로 해결하도록 기대하는 구조

---

## 완료 기준

다음이 모두 만족되면 이 설계는 구현 준비 상태로 본다.

1. Moses 역할 경계가 명확하다.
2. bundled core subagent의 위치가 분명하다.
3. discovery 대상과 non-target이 분리된다.
4. internal detailed plan과 user-facing summary의 차이가 명확하다.
5. skill planning / reporting 책임이 정의된다.
6. cheap worker를 위한 detailed delegation contract가 명시된다.
7. reviewer / validator가 completion gate 일부로 고정된다.
8. approval boundary와 change-control rule이 분명하다.

---

## 요약

Moses는 앞으로 "직접 일하는 supervisor"가 아니라, **workflow를 먼저 선언하고, 승인 범위를 확보하고, bundled subagents와 cheap leaf workers를 강한 계약으로 움직이는 control plane**이어야 한다.

사용자는 Moses 하나만 보지만, 내부에서는 다음이 일어난다.

1. capability discovery
2. clarification
3. internal detailed planning
4. user approval summary 제시
5. one-time approval
6. subagent orchestration
7. detailed delegation to cheap workers
8. review / validation / bounded refactor
9. completion reporting

이 구조가 Moses를 Superpowers-like workflow discipline에 가깝게 만들면서도, bundled-team architecture와 low-cost execution 현실에 맞춘다.
