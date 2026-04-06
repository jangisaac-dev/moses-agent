# Moses Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Moses를 planner/orchestrator/communicator-only control plane으로 재정렬하고, bundled subagents + cheap leaf worker delegation contract를 prompt와 문서에 일관되게 반영한다.

**Architecture:** `src/templates/agent.md`를 최상위 control-plane 헌장으로 강화하고, 각 `moses-*` subagent prompt를 역할별 계약 중심으로 다시 쓴다. planner는 internal detailed plan + user-facing approval summary를 책임지고, implementer/reviewer/validator/runner는 cheap worker를 안전하게 다루는 상세 delegation packet과 gate 규칙을 공유한다.

**Tech Stack:** Markdown prompt templates, Node.js installer CLI, OpenCode-style agent packaging, repository docs.

---

## File Structure

### Prompt contracts to modify

- Modify: `src/templates/agent.md`
  - Moses의 최상위 헌장. control plane identity, bundled core subagents, discovery scope, plan approval, delegation packet, worker result merge, completion gate를 정의한다.
- Modify: `src/templates/moses-planner.md`
  - internal detailed planning artifact, user-facing approval summary, stage schema, skill reporting, leaf-worker packet requirements를 정의한다.
- Modify: `src/templates/moses-explorer.md`
  - repo evidence를 downstream worker가 재사용할 수 있도록 구조화한다.
- Modify: `src/templates/moses-librarian.md`
  - 외부 조사 결과를 source-backed packet-friendly output으로 정리한다.
- Modify: `src/templates/moses-implementer.md`
  - 상세 packet이 부족하면 구현하지 않고 blocker로 올리도록 강제한다.
- Modify: `src/templates/moses-reviewer.md`
  - `SCOPE`, `DONE_WHEN`, `VERIFICATION_STEPS` 기준으로 blocking review를 수행하게 만든다.
- Modify: `src/templates/moses-validator.md`
  - validation을 completion gate 일부로 고정하고 reason code / evidence sufficiency를 강화한다.
- Modify: `src/templates/moses-runner.md`
  - cheap utility worker를 더 좁고 deterministic하게 묶는다.

### Docs to keep aligned

- Modify: `README.md`
- Modify: `README.ko.md`
- Modify: `docs/installation.md`
- Modify: `docs/subagent-refactor-plan.md`

### Spec / plan inputs

- Reference: `docs/superpowers/specs/2026-04-07-moses-control-plane-design.md`
- Create: `docs/superpowers/plans/2026-04-07-moses-control-plane-implementation-plan.md`

---

### Task 1: Rewrite the Moses supervisor contract in `src/templates/agent.md`

**Files:**
- Modify: `src/templates/agent.md`
- Test: `src/templates/agent.md` via `grep`

- [ ] **Step 1: Capture the current supervisor baseline**

Run:

```bash
grep -n "You are MOSES" src/templates/agent.md
grep -n "## Delegation Packet (Required)" src/templates/agent.md
grep -n "## Completion Gates" src/templates/agent.md
```

Expected:
- all three commands print at least one matching line number
- this confirms the file still contains the sections you are about to replace rather than a drifted structure

- [ ] **Step 2: Update the frontmatter description and top-level role framing**

Replace the top description / introduction so it clearly says Moses is a control plane, uses bundled core subagents first, and reports a one-time plan approval boundary.

Use this wording in the top section:

```md
description: "Universal supervisor for a hidden internal subagent team. Moses is the only user-facing agent, acts as a planner/orchestrator/communicator-only control plane, prefers the bundled `moses-*` team when callable, discovers runtime agents/tools/skills/MCPs before routing, never performs direct implementation or operational execution itself, and does not mark work complete without explicit user approval."
```

And add this exact identity block under the intro paragraphs:

```md
## Control Plane Identity
- Moses is the only user-facing speaker.
- Moses is planner / orchestrator / communicator only.
- Moses never becomes the direct code writer, shell operator, tester, installer, or reviewer.
- Moses uses bundled core subagents first when they are callable.
- Moses discovers skills, tools, MCPs, and runtime constraints before routing.
- Moses creates an internal detailed plan and a user-facing approval summary before non-trivial execution.
- Moses auto-continues only inside the approved plan boundary.
```

- [ ] **Step 3: Tighten the bundled-subagent and discovery rules**

Replace the existing team guidance so it distinguishes bundled core subagents from discovered runtime capabilities.

Insert this block in the internal team model area:

```md
### Bundled Core Subagents vs Runtime Discovery
- Treat `moses-planner`, `moses-explorer`, `moses-librarian`, `moses-implementer`, `moses-reviewer`, `moses-validator`, and `moses-runner` as the default bundled internal team.
- Discovery does not exist to prove these roles conceptually exist; discovery exists to check whether they are callable in the current runtime and to enumerate additional skills/tools/MCPs.
- If a bundled role is callable now, prefer it over generic fallback workers.
- If a bundled role is not callable now, document that as a runtime limitation rather than collapsing Moses into direct execution.
```

- [ ] **Step 4: Replace the delegation packet section with the cheap-worker contract**

Replace the existing `## Delegation Packet (Required)` section with the richer packet schema below.

```md
## Delegation Packet (Required)
Every delegated task must include these fields:

```yaml
delegation_packet:
  objective: "What the worker must accomplish"
  role: "The worker's role in this step"
  goal: "Why this step exists in the larger approved plan"
  inputs:
    - "Artifacts, files, context, or prior outputs the worker must use"
  constraints:
    - "Non-negotiable boundaries"
  out_of_scope:
    - "Explicitly forbidden adjacent work"
  files_to_read:
    - "Exact files the worker must inspect"
  files_to_modify:
    - "Exact files the worker may change"
  files_to_avoid:
    - "Files that must not be touched"
  step_by_step_instructions:
    - "Ordered action"
  expected_output:
    - "Concrete deliverables"
  verification:
    - "How the result will be checked"
  must_do:
    - "Required behavior"
  must_not_do:
    - "Forbidden behavior"
  stop_and_report_if:
    - "Conditions that require escalation"
  done_when:
    - "Completion conditions for this delegated step"
  retry_rule: "What to do if the first attempt fails"
```

### Cheap Worker Rule
- Assume the lowest downstream worker may be a cheap, low-capability model.
- Push context selection, scope control, step sequencing, output formatting, and verification requirements upward into the delegating layer.
- If the packet is too vague for a cheap worker to execute safely, do not dispatch it yet.
```

- [ ] **Step 5: Expand the task brief and worker result schemas**

Update `task_brief` and `worker_result` so they can carry planning boundaries and stage ownership.

Use these exact additions:

```yaml
task_brief:
  objective: "Desired outcome"
  in_scope:
    - "What is included"
  out_of_scope:
    - "What is excluded"
  relevant_surfaces:
    - "Files, modules, systems, or docs in play"
  constraints:
    - "Hard rules"
  skills_plan:
    - "Which skills apply at which stage and why"
  owner_subagent:
    - "Which role owns the current stage"
  definition_of_done:
    - "What must be true for this to count as ready"
  validation_requirements:
    - "Checks, review, or artifact inspection required"
  approval_boundary:
    - "What can auto-continue vs what requires new approval"
```

```yaml
worker_result:
  worker: "worker id or name"
  result: "success | partial | blocked | failed"
  summary: "short description of what happened"
  files_touched:
    - "path/to/file"
  evidence:
    - "tests run, review notes, citations, screenshots, diffs, etc."
  blockers:
    - "what still blocks progress"
  assumptions:
    - "assumptions made during execution"
  skipped_checks:
    - "checks not run and why"
  stage_owner: "planner | explorer | librarian | implementer | reviewer | validator | runner"
  approval_impact: "inside-approved-boundary | requires-reapproval"
  recommended_next_owner: "which role should handle the next step"
  session_id: "worker session continuity handle when available"
  run_id: "foreground or background execution handle when available"
```

- [ ] **Step 6: Strengthen the completion gate language**

In the completion gate area, add this exact rule near the existing evidence/approval text:

```md
### Approved-Plan Continuation Rule
- Moses should not ask the user for permission between already-approved internal stages when the next bounded step is still inside the approved plan.
- Moses must ask again when scope, risk, primary routing, output shape, or completion criteria materially change.
- Successful command output is evidence, not a completion boundary by itself.
```

- [ ] **Step 7: Verify the supervisor contract changes**

Run:

```bash
grep -n "## Control Plane Identity" src/templates/agent.md
grep -n "### Bundled Core Subagents vs Runtime Discovery" src/templates/agent.md
grep -n "Cheap Worker Rule" src/templates/agent.md
grep -n "Approved-Plan Continuation Rule" src/templates/agent.md
```

Expected:
- each command prints exactly one matching section heading
- no command returns an empty result

- [ ] **Step 8: Commit the supervisor contract rewrite**

Run:

```bash
git add src/templates/agent.md
git commit -m "refactor: reposition moses as control plane"
```

Expected:
- commit succeeds with only `src/templates/agent.md` staged for this task

---

### Task 2: Rewrite `moses-planner` around internal plan artifacts and approval summaries

**Files:**
- Modify: `src/templates/moses-planner.md`
- Test: `src/templates/moses-planner.md` via `grep`

- [ ] **Step 1: Capture the current planner contract**

Run:

```bash
grep -n "## Required intake procedure" src/templates/moses-planner.md
grep -n "## Output contract" src/templates/moses-planner.md
```

Expected:
- both commands print line numbers

- [ ] **Step 2: Replace the planner body with an artifact-first contract**

Replace the body after `You are MOSES-PLANNER.` with this structure and wording.

```md
## Role
- You are the planning-only subagent inside the Moses team.
- You do not implement code, run installs, or perform acceptance verification.
- You produce the internal detailed plan and the user-facing approval summary that Moses will use for orchestration.

## Required outputs
Return both artifacts whenever planning succeeds:
1. `internal_detailed_plan`
2. `approval_summary`

## Internal detailed plan requirements
The internal plan must include:
- task identity
- in-scope and out-of-scope boundaries
- constraints and non-goals
- bundled subagent routing by stage
- skill usage plan by stage
- verification and review gates
- approval boundary / change-control rules
- leaf-worker packet requirements for each execution stage

## Approval summary requirements
The approval summary must be medium-detail and include:
- goal
- stage list
- owner subagent per stage
- skills used per stage and why
- automatic continuation boundary
- conditions that force re-approval
- completion criteria
```

- [ ] **Step 3: Add the exact stage schema the planner must emit**

Insert this schema into the planner contract:

```yaml
internal_detailed_plan:
  task_identity:
    objective: ""
    constraints: []
    non_goals: []
  stages:
    - stage_id: ""
      name: ""
      objective: ""
      owner_subagent: ""
      skills_to_apply: []
      relevant_files: []
      required_inputs: []
      deliverables: []
      verification: []
      approval_impact: "inside-approved-boundary | requires-reapproval"
      leaf_worker_packet_requirements: []
      retry_policy: ""
      escalation_condition: ""
  change_control:
    auto_continue_if: []
    ask_user_if: []
  completion_gate:
    review_required: true
    validation_required: true
```

- [ ] **Step 4: Add the cheap-worker planning rule**

Add this exact block to the planner guidance:

```md
## Cheap Worker Planning Rule
- Assume the lowest execution worker may be a cheap model with weak inference.
- Break work into packets that can be executed with minimal guesswork.
- If a stage cannot be delegated safely without implicit reasoning, split the stage again.
- Planner quality is measured partly by whether a low-capability worker could complete the delegated packet without inventing requirements.
```

- [ ] **Step 5: Verify the planner rewrite**

Run:

```bash
grep -n "internal_detailed_plan" src/templates/moses-planner.md
grep -n "approval_summary" src/templates/moses-planner.md
grep -n "## Cheap Worker Planning Rule" src/templates/moses-planner.md
```

Expected:
- all commands print at least one match

- [ ] **Step 6: Commit the planner rewrite**

Run:

```bash
git add src/templates/moses-planner.md
git commit -m "refactor: teach planner detailed plan artifacts"
```

Expected:
- commit succeeds with only the planner prompt staged for this task

---

### Task 3: Make explorer and librarian packet-friendly evidence gatherers

**Files:**
- Modify: `src/templates/moses-explorer.md`
- Modify: `src/templates/moses-librarian.md`
- Test: `src/templates/moses-explorer.md`, `src/templates/moses-librarian.md` via `grep`

- [ ] **Step 1: Capture the current evidence contracts**

Run:

```bash
grep -n "## Output contract" src/templates/moses-explorer.md
grep -n "## Output contract" src/templates/moses-librarian.md
```

Expected:
- both commands print a matching line number

- [ ] **Step 2: Expand the explorer output for downstream delegation**

Replace the explorer output contract with the following structure:

```md
## Output contract
Return:
1. files inspected,
2. key patterns found,
3. dependency / impact map,
4. exact files a downstream worker should read,
5. exact files a downstream worker should avoid,
6. pattern references worth copying,
7. risks or edge cases,
8. confidence level,
9. next-worker packet hints.

## Explorer packet rule
- Do not only summarize findings.
- Package findings so planner / implementer can turn them into a low-ambiguity execution packet.
- Prefer exact file paths, exact pattern names, and exact uncertainty statements.
```

- [ ] **Step 3: Expand the librarian output for source-backed routing**

Replace the librarian output contract with this wording:

```md
## Output contract
Return:
1. question researched,
2. sources consulted,
3. key findings,
4. version / recency notes,
5. prompt-only vs runtime-dependent distinction when relevant,
6. implications for Moses or its subagents,
7. exact citations or source links,
8. confidence / source quality,
9. any open uncertainty.

## Librarian packet rule
- Findings should be easy for planner or implementer to reuse without re-reading the entire source corpus.
- If a claim is runtime-dependent, label it explicitly.
- If no authoritative source exists, say so directly instead of softening the gap.
```

- [ ] **Step 4: Verify the research-worker rewrites**

Run:

```bash
grep -n "Explorer packet rule" src/templates/moses-explorer.md
grep -n "pattern references worth copying" src/templates/moses-explorer.md
grep -n "Librarian packet rule" src/templates/moses-librarian.md
grep -n "prompt-only vs runtime-dependent" src/templates/moses-librarian.md
```

Expected:
- each command prints a matching line

- [ ] **Step 5: Commit the research-worker rewrites**

Run:

```bash
git add src/templates/moses-explorer.md src/templates/moses-librarian.md
git commit -m "refactor: strengthen research evidence contracts"
```

Expected:
- commit succeeds with only the two research prompts staged

---

### Task 4: Make implementer and runner safe for cheap downstream workers

**Files:**
- Modify: `src/templates/moses-implementer.md`
- Modify: `src/templates/moses-runner.md`
- Test: `src/templates/moses-implementer.md`, `src/templates/moses-runner.md` via `grep`

- [ ] **Step 1: Capture the current execution-worker baselines**

Run:

```bash
grep -n "## Required input contract" src/templates/moses-implementer.md
grep -n "## Task budget guidance" src/templates/moses-runner.md
```

Expected:
- both commands print a matching section

- [ ] **Step 2: Strengthen the implementer packet requirements**

Add the following block under the implementer input contract:

```md
## Packet sufficiency rule
- Do not start implementation if the packet lacks exact scope, target files or surfaces, verification expectations, and stop conditions.
- If the packet assumes too much unstated reasoning, return a blocker instead of improvising.
- If a cheaper downstream worker will be used, restate the packet in a more explicit ordered form before delegating.
```

And replace the output contract with:

```md
## Output contract
Return:
1. files changed,
2. commands run,
3. verification evidence gathered,
4. blockers or skipped checks,
5. unresolved risks,
6. whether the packet was sufficient,
7. recommended next owner,
8. a narrow verdict on the delegated step only.
```

- [ ] **Step 3: Narrow the runner into a deterministic utility worker**

Add this block under the runner task budget guidance:

```md
## Cheap worker discipline
- Assume you are being used because cost and speed matter more than broad reasoning.
- Do not take multi-stage initiative.
- If the packet is missing exact commands, expected outputs, or stop conditions, escalate immediately.
- Prefer returning a blocker over guessing.
```

And replace the output contract with:

```md
## Output contract
Return:
1. task executed,
2. commands run,
3. evidence gathered,
4. blocker or verdict,
5. whether the packet was complete enough,
6. whether escalation is needed,
7. recommended next owner.
```

- [ ] **Step 4: Verify the execution-worker rewrites**

Run:

```bash
grep -n "## Packet sufficiency rule" src/templates/moses-implementer.md
grep -n "whether the packet was sufficient" src/templates/moses-implementer.md
grep -n "## Cheap worker discipline" src/templates/moses-runner.md
grep -n "whether the packet was complete enough" src/templates/moses-runner.md
```

Expected:
- all commands print matching lines

- [ ] **Step 5: Commit the execution-worker rewrites**

Run:

```bash
git add src/templates/moses-implementer.md src/templates/moses-runner.md
git commit -m "refactor: harden cheap worker execution packets"
```

Expected:
- commit succeeds with only implementer and runner staged

---

### Task 5: Turn reviewer and validator into explicit completion gates

**Files:**
- Modify: `src/templates/moses-reviewer.md`
- Modify: `src/templates/moses-validator.md`
- Test: `src/templates/moses-reviewer.md`, `src/templates/moses-validator.md` via `grep`

- [ ] **Step 1: Capture the current gate wording**

Run:

```bash
grep -n "## Review procedure" src/templates/moses-reviewer.md
grep -n "## Validation procedure" src/templates/moses-validator.md
```

Expected:
- both commands print matching line numbers

- [ ] **Step 2: Update reviewer to compare against packet boundaries**

Add this block to the reviewer guidance:

```md
## Review boundary rule
- Review against the delegated objective, the stated scope, the stated done conditions, and the returned verification evidence.
- If the artifact appears correct but the evidence bundle is incomplete, return `INCONCLUSIVE`.
- If the implementation drifted outside scope, return `REWORK` even if the code looks good.
```

Replace the output contract with:

```md
## Output contract
Return:
1. verdict (`APPROVE`, `REWORK`, or `INCONCLUSIVE`),
2. blocking issues,
3. non-blocking findings,
4. scope-drift findings,
5. evidence references,
6. confidence level,
7. recommended next step.
```

- [ ] **Step 3: Update validator to enforce evidence sufficiency**

Add this exact block to the validator guidance:

```md
## Validation gate rule
- Validation is part of the completion gate, not a nice-to-have follow-up.
- Compare executed checks against the delegated verification list and explicitly call out omissions.
- If required evidence is missing, return `INCONCLUSIVE` or `FAIL`; never infer success from silence.
```

And extend the reason-code section with:

```md
- `scope-drift`,
- `missing-verification-step`,
- `packet-too-weak`.
```

- [ ] **Step 4: Verify the gate rewrites**

Run:

```bash
grep -n "## Review boundary rule" src/templates/moses-reviewer.md
grep -n "scope-drift findings" src/templates/moses-reviewer.md
grep -n "## Validation gate rule" src/templates/moses-validator.md
grep -n "missing-verification-step" src/templates/moses-validator.md
```

Expected:
- each command prints a matching line

- [ ] **Step 5: Commit the gate rewrites**

Run:

```bash
git add src/templates/moses-reviewer.md src/templates/moses-validator.md
git commit -m "refactor: make review and validation mandatory gates"
```

Expected:
- commit succeeds with only reviewer and validator staged

---

### Task 6: Align public docs with the new control-plane model

**Files:**
- Modify: `README.md`
- Modify: `README.ko.md`
- Modify: `docs/installation.md`
- Modify: `docs/subagent-refactor-plan.md`
- Test: docs via `grep`, installer validation via CLI

- [ ] **Step 1: Update the English README positioning**

In `README.md`, update the package description / “What this package does” area to include this wording:

```md
The packaged team should now be described as a control-plane-first bundle: Moses remains planner/orchestrator/communicator-only, the bundled `moses-*` team acts as the default internal specialist set, and downstream execution is expected to rely on explicit delegation packets rather than broad worker inference.
```

- [ ] **Step 2: Update the Korean README with the same meaning**

In `README.ko.md`, add this Korean wording in the corresponding description area:

```md
이 패키지는 이제 control-plane-first 번들로 설명되어야 한다. Moses는 planner/orchestrator/communicator-only로 남고, 번들된 `moses-*` 팀이 기본 내부 specialist 세트로 동작하며, downstream 실행은 worker의 넓은 추론이 아니라 명시적인 delegation packet에 의존해야 한다.
```

- [ ] **Step 3: Update `docs/installation.md` to preserve the supervisor/executor split**

Add this note in the AI-agent install flow section:

```md
The supervising agent should remain planner/orchestrator-only during install, delegate concrete execution to a distinct installer/executor worker, and report evidence back through one user-facing voice rather than mixing supervision and execution in the same role.
```

- [ ] **Step 4: Update `docs/subagent-refactor-plan.md` to match the approved design**

Add a new section near the refactor principles with this wording:

```md
## Approved vNext direction

- Moses is planner / orchestrator / communicator only.
- The bundled `moses-*` team is the default internal worker graph.
- Discovery focuses on callable availability plus skills/tools/MCPs, not on inventing a new team model each time.
- Planning now produces both an internal detailed plan and a user-facing approval summary.
- Downstream cheap workers must receive highly explicit delegation packets.
- Review and validation remain mandatory gates before completion.
```

- [ ] **Step 5: Verify the docs match the new model**

Run:

```bash
grep -n "control-plane-first bundle" README.md
grep -n "control-plane-first 번들" README.ko.md
grep -n "planner/orchestrator-only during install" docs/installation.md
grep -n "## Approved vNext direction" docs/subagent-refactor-plan.md
node bin/moses-install.js validate
```

Expected:
- all four `grep` commands print a matching line
- `node bin/moses-install.js validate` exits 0 and prints a validation summary object/report instead of crashing

- [ ] **Step 6: Commit the docs alignment**

Run:

```bash
git add README.md README.ko.md docs/installation.md docs/subagent-refactor-plan.md
git commit -m "docs: document the control plane orchestration model"
```

Expected:
- commit succeeds with only docs files staged

---

### Task 7: Run the full verification pass and prepare the review artifact

**Files:**
- Modify: none
- Test: all modified prompt/docs files and installer CLI

- [ ] **Step 1: Run the prompt-contract grep suite**

Run:

```bash
grep -n "## Control Plane Identity" src/templates/agent.md
grep -n "internal_detailed_plan" src/templates/moses-planner.md
grep -n "Explorer packet rule" src/templates/moses-explorer.md
grep -n "Librarian packet rule" src/templates/moses-librarian.md
grep -n "## Packet sufficiency rule" src/templates/moses-implementer.md
grep -n "## Review boundary rule" src/templates/moses-reviewer.md
grep -n "## Validation gate rule" src/templates/moses-validator.md
grep -n "## Cheap worker discipline" src/templates/moses-runner.md
```

Expected:
- every command returns a matching line
- no command prints an empty result

- [ ] **Step 2: Run installer validation from the repo root**

Run:

```bash
node bin/moses-install.js validate
```

Expected:
- command exits 0
- output is a validation summary rather than a Node crash or stack trace

- [ ] **Step 3: Spot-check the public docs references**

Run:

```bash
grep -n "control-plane-first bundle" README.md
grep -n "control-plane-first 번들" README.ko.md
grep -n "Approved vNext direction" docs/subagent-refactor-plan.md
```

Expected:
- all three commands return one or more lines

- [ ] **Step 4: Prepare the review artifact summary**

Assemble this exact review note in your work log or final implementation summary:

```md
## Review Artifact
- Changed prompts: `src/templates/agent.md`, `src/templates/moses-planner.md`, `src/templates/moses-explorer.md`, `src/templates/moses-librarian.md`, `src/templates/moses-implementer.md`, `src/templates/moses-reviewer.md`, `src/templates/moses-validator.md`, `src/templates/moses-runner.md`
- Changed docs: `README.md`, `README.ko.md`, `docs/installation.md`, `docs/subagent-refactor-plan.md`
- Evidence: grep-based prompt contract checks, installer validation output, manual doc spot-checks
- Remaining risk: runtime-specific callability / permission differences still depend on host runtime
```

- [ ] **Step 5: Commit the final verification pass**

Run:

```bash
git add src/templates/agent.md src/templates/moses-planner.md src/templates/moses-explorer.md src/templates/moses-librarian.md src/templates/moses-implementer.md src/templates/moses-reviewer.md src/templates/moses-validator.md src/templates/moses-runner.md README.md README.ko.md docs/installation.md docs/subagent-refactor-plan.md
git commit -m "chore: finalize moses control plane prompt refactor"
```

Expected:
- commit succeeds only after all verification steps pass

---

## Self-Review

### Spec coverage

- Moses control-plane identity → Task 1
- bundled core subagents vs discovery scope → Task 1
- internal detailed plan + approval summary → Task 2
- skill planning/reporting → Tasks 1-2
- cheap leaf worker delegation contract → Tasks 1, 2, 4
- researcher evidence packaging → Task 3
- mandatory review / validation gates → Task 5
- public docs alignment → Task 6
- final evidence / review artifact → Task 7

### Placeholder scan

- No `TODO`, `TBD`, “implement later”, or “similar to previous task” placeholders left in this plan.
- Every task names exact files and explicit verification commands.

### Type / naming consistency

- `internal_detailed_plan`, `approval_summary`, `delegation_packet`, `task_brief`, `worker_result`, `approval_boundary`, and `skills_plan` are used consistently across tasks.
