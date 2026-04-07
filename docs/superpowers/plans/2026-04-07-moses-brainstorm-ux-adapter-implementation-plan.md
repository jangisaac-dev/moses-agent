# Moses Brainstorm UX Adapter Implementation Plan

> Status: executed on `moses-control-plane` for the `1.0.2` release line.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Moses의 기존 control-plane 판단 로직은 그대로 유지하면서, 초기 brainstorming / clarification 진입부에 host runtime capability별 UX adapter layer를 추가한다.

**Architecture:** `src/templates/agent.md`에 `Brainstorm UX Adapter` 계약을 추가해 초기 bounded intake를 host-aware하게 표현한다. OpenCode에서는 structured question/select를 우선 사용하고, structured interaction이 없는 환경에서는 numbered text 또는 minimal text fallback으로 같은 intent를 전달한다. planner, approval summary, orchestration, validation 로직은 그대로 유지한다.

**Tech Stack:** Markdown prompt templates, OpenCode `question` tool contract, repository README docs, OpenCode CLI runtime smoke tests.

---

## File Structure

- Modify: `src/templates/agent.md`
  - 초기 intake, UX adapter activation, capability-based adapter selection, clarification 질문 표현 규칙을 정의한다.
- Modify: `README.md`
  - 영어 사용자 문서에 host-aware brainstorming UX behavior를 설명한다.
- Modify: `README.ko.md`
  - 한국어 사용자 문서에 같은 behavior를 설명한다.
- Reference: `docs/superpowers/specs/2026-04-07-moses-brainstorm-ux-adapter-design.md`
- Create: `docs/superpowers/plans/2026-04-07-moses-brainstorm-ux-adapter-implementation-plan.md`

---

### Task 1: Add the host-aware brainstorm adapter contract to `src/templates/agent.md`

**Files:**
- Modify: `src/templates/agent.md`
- Test: `src/templates/agent.md` via `grep`

- [ ] **Step 1: Capture the current intake and clarification baseline**

Run:

```bash
grep -n "## Planning-First Intake" src/templates/agent.md
grep -n "## Clarification Interview Gate" src/templates/agent.md
grep -n "Prefer confirmation questions over open-ended brainstorming" src/templates/agent.md
```

Expected:
- all three commands print at least one matching line number
- this confirms the current prompt still contains the intake and clarification sections you are about to update

- [ ] **Step 2: Verify the new adapter section does not exist yet**

Run:

```bash
grep -n "## Host-Aware Brainstorm UX Adapter" src/templates/agent.md
grep -n "StructuredSelectAdapter" src/templates/agent.md
```

Expected:
- both commands return no matches
- this is the failing precondition for the new contract you are about to add

- [ ] **Step 3: Replace the `Planning-First Intake` block with the adapter-aware version**

Replace the current `## Planning-First Intake` section with this exact block:

```md
## Planning-First Intake
At the start of every substantive request:
1. **Run Discovery** (mandatory — see Discovery Protocol below).
2. Classify the work.
3. Identify missing scope boundaries, constraints, tradeoffs, and success criteria.
4. If ambiguity remains and a bounded host-appropriate intake would reduce user effort, run the Brainstorm UX Adapter before the Clarification Interview Gate.
5. Run the Clarification Interview Gate if ambiguity still remains and the answer materially changes execution.
6. Propose a short execution plan before orchestration begins.

If the request is trivial and informational, you may answer directly — but discovery still runs silently in the background, and both the Brainstorm UX Adapter and the clarification interview are skipped unless ambiguity would materially change the answer.

For a trivial, read-only check, Moses may use direct tools itself. For operational work such as shell execution, code mutation, installs, builds, or multi-step verification, Moses should still prefer delegation whenever a callable worker is available.
```

- [ ] **Step 4: Insert the new adapter section between intake and clarification**

Insert this exact block immediately after `## Planning-First Intake` and before `## Clarification Interview Gate`:

```md
## Host-Aware Brainstorm UX Adapter

### Purpose
Use a thin, host-aware intake layer to present the same bounded brainstorming intent through the best interaction surface the current runtime actually supports.

### Activation Rule
Run the adapter only when ALL are true:
1. the request is non-trivial,
2. meaningful ambiguity remains,
3. and a bounded intake interaction is likely to reduce user effort before planning.

Skip the adapter when the request is already precise enough to route safely, when the request is trivial and informational, or when a plain clarification question is more natural than a structured interaction.

### Capability-First Selection
Select the adapter by capability before framework branding.

Use these normalized capability checks where practical:
- `supports_structured_question`
- `supports_single_select`
- `supports_multi_select`
- `supports_custom_answer`
- `supports_multi_question_submission`
- `supports_text_only_prompt`

### Adapter Modes
- `StructuredSelectAdapter` — use when the runtime supports structured question/select UX plus custom answers.
- `EnumeratedTextAdapter` — use when the runtime lacks structured question tools but supports reliable line-based text interaction.
- `MinimalTextFallbackAdapter` — use when capability detection is weak or only plain text prompting is safe.

### Normalized Intake Signals
No matter which adapter is used, normalize the outcome into the same internal intake signals:
- `purpose_choice`
- `response_style_choice`
- `custom_input_present`
- `ux_mode_used`

Treat these signals as framing hints for planning and clarification, not as a replacement for the user's actual request text.
```

- [ ] **Step 5: Extend the clarification gate with presentation, precedence, and fallback rules**

Under `## Clarification Interview Gate`, keep the existing purpose / trigger / interview rules, then insert this exact block after `### Interview Rules` and before `### Preferred Question Types`:

```md
### Host-Aware Question Presentation
- Preserve the same question meaning across all adapter modes.
- Prefer `StructuredSelectAdapter` when the runtime exposes structured question/select plus custom-answer support.
- Fall back to `EnumeratedTextAdapter` when structured questioning is unavailable but text interaction is stable.
- Fall back again to `MinimalTextFallbackAdapter` when only plain text prompting is safe.
- Keep the entire bounded intake + clarification sequence within the existing `2-4 targeted questions max` rule unless one additional bounded round is explicitly justified.

### Precedence and Fallback Rules
- The user's original request text has higher priority than adapter output.
- Freeform user input has higher priority than a selected option label.
- Adapter output is an intake signal, not a binding plan override.
- If a structured question attempt fails, immediately restate the same bounded choice in text form and continue.
- If the adapter adds more friction than clarity, skip it and continue with the normal clarification interview.
```

- [ ] **Step 6: Verify the new contract is present**

Run:

```bash
grep -n "## Host-Aware Brainstorm UX Adapter" src/templates/agent.md
grep -n "### Capability-First Selection" src/templates/agent.md
grep -n "StructuredSelectAdapter" src/templates/agent.md
grep -n "### Host-Aware Question Presentation" src/templates/agent.md
grep -n "### Precedence and Fallback Rules" src/templates/agent.md
```

Expected:
- each command prints exactly one matching section or rule block
- no command returns an empty result

- [ ] **Step 7: Commit the prompt-contract change**

Run:

```bash
git add src/templates/agent.md
git commit -m "Add host-aware brainstorm adapter rules"
```

Expected:
- commit succeeds with only `src/templates/agent.md` included for this task

---

### Task 2: Document the host-aware brainstorming UX in `README.md` and `README.ko.md`

**Files:**
- Modify: `README.md`
- Modify: `README.ko.md`
- Test: `README.md`, `README.ko.md` via `grep`

- [ ] **Step 1: Capture the current documentation anchors**

Run:

```bash
grep -n "## What this package does" README.md
grep -n "## What this package does" README.ko.md
grep -n "## Known limitations" README.md
grep -n "## Known limitations" README.ko.md
```

Expected:
- all four commands print line numbers
- this identifies safe insertion points for the new behavior description

- [ ] **Step 2: Verify the new docs section does not exist yet**

Run:

```bash
grep -n "## Host-aware brainstorming UX" README.md
grep -n "## 호스트별 브레인스토밍 UX" README.ko.md
```

Expected:
- both commands return no matches

- [ ] **Step 3: Add the English behavior section to `README.md`**

Insert this exact section after `## What this package does` in `README.md`:

```md
## Host-aware brainstorming UX

When Moses needs bounded up-front clarification, it first checks what interaction affordances the current host runtime exposes.

- In OpenCode-style runtimes with structured question support, Moses can present select-style intake prompts.
- In generic CLI environments, Moses falls back to numbered text choices plus freeform input.
- In text-only environments, Moses uses short multiple-choice phrasing in plain text.
- Precise requests skip this layer and continue through the normal planning-first flow.

This adapter changes the user experience of the initial intake only. It does **not** change Moses's planning, approval, orchestration, or validation logic.
```

- [ ] **Step 4: Add the Korean behavior section to `README.ko.md`**

Insert this exact section after `## What this package does` in `README.ko.md`:

```md
## 호스트별 브레인스토밍 UX

Moses가 초기에 bounded clarification이 필요하다고 판단하면, 먼저 현재 호스트 런타임이 어떤 상호작용 수단을 제공하는지 확인합니다.

- OpenCode처럼 구조화된 질문 도구를 지원하는 런타임에서는 select-style intake prompt를 사용할 수 있습니다.
- 일반 CLI 환경에서는 번호형 선택지와 자유 입력으로 폴백합니다.
- text-only 환경에서는 짧은 다지선다 문장을 plain text로 제시합니다.
- 요청이 이미 충분히 구체적이면 이 레이어를 건너뛰고 기존 planning-first 흐름으로 바로 진행합니다.

이 adapter는 초기 intake의 UX만 바꿉니다. Moses의 planning, approval, orchestration, validation 로직은 바꾸지 않습니다.
```

- [ ] **Step 5: Verify both docs sections are present**

Run:

```bash
grep -n "## Host-aware brainstorming UX" README.md
grep -n "structured question support" README.md
grep -n "## 호스트별 브레인스토밍 UX" README.ko.md
grep -n "구조화된 질문 도구" README.ko.md
```

Expected:
- all four commands print at least one matching line
- the English and Korean sections both mention structured-host behavior and fallback behavior

- [ ] **Step 6: Commit the documentation updates**

Run:

```bash
git add README.md README.ko.md
git commit -m "Document host-aware brainstorm UX"
```

Expected:
- commit succeeds with only the two README files included for this task

---

### Task 3: Verify that the adapter preserves logic while changing the intake UX

**Files:**
- Test: `src/templates/agent.md`
- Test: `README.md`
- Test: `README.ko.md`

- [ ] **Step 1: Review the final changed surface area**

Run:

```bash
git diff --stat HEAD~2..HEAD
```

Expected:
- output shows changes limited to `src/templates/agent.md`, `README.md`, and `README.ko.md`
- there are no accidental edits outside the planned files

- [ ] **Step 2: Smoke-test the vague-request path in OpenCode**

Run:

```bash
opencode run --agent moses --dir "/Volumes/ssd/opencode_workspace/moses-agent/.worktrees/moses-control-plane" --format json "작업을 바로 시작하지 말고, 내가 아직 목적을 명확히 못 정했다고 가정하고 처음에 어떤 선택지로 도와줄지 먼저 보여줘."
```

Expected:
- the JSON event stream shows either a `question`-tool interaction or a bounded textual first response that offers purpose-style choices before any execution-plan summary
- there are no `edit`, `write`, or operational `bash` events before that first intake interaction

- [ ] **Step 3: Smoke-test the precise-request bypass path in OpenCode**

Run:

```bash
opencode run --agent moses --dir "/Volumes/ssd/opencode_workspace/moses-agent/.worktrees/moses-control-plane" --format json "README.md의 Installation 섹션을 두 문장으로만 요약해라. 질문하지 말고 바로 답해라."
```

Expected:
- the JSON event stream returns a direct answer without a `question`-tool interaction
- this confirms the adapter does not trigger for already precise requests

- [ ] **Step 4: Reconfirm the adapter headings and docs headings after smoke tests**

Run:

```bash
grep -n "## Host-Aware Brainstorm UX Adapter" src/templates/agent.md
grep -n "### Precedence and Fallback Rules" src/templates/agent.md
grep -n "## Host-aware brainstorming UX" README.md
grep -n "## 호스트별 브레인스토밍 UX" README.ko.md
```

Expected:
- all four commands still print matches
- smoke testing did not require any prompt or docs rollback

---

## Self-Review Checklist

- [ ] Spec coverage check: the plan updates the prompt contract, adapter selection rules, fallback rules, docs alignment, and runtime smoke verification from `docs/superpowers/specs/2026-04-07-moses-brainstorm-ux-adapter-design.md`.
- [ ] Placeholder scan: confirm this plan contains no `TBD`, `TODO`, `implement later`, or vague “add handling” instructions.
- [ ] Type consistency check: keep the adapter names and normalized signal names exactly consistent across `src/templates/agent.md`, docs, and verification steps.
