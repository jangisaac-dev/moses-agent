# Moses — Universal Team-Lead Orchestrator

> A callable OpenCode agent that receives high-level instructions, delegates to specialist workers, collects evidence, and never marks work complete without explicit user approval.

---

## Table of Contents

1. [What Is Moses](#what-is-moses)
2. [Architecture](#architecture)
3. [How It Works — The Full Process](#how-it-works--the-full-process)
4. [Domain Classification Matrix](#domain-classification-matrix)
5. [Delegation Packet Schema](#delegation-packet-schema)
6. [Completion Gates](#completion-gates)
7. [Repair Loop Policy](#repair-loop-policy)
8. [Installation](#installation)
9. [Usage](#usage)
10. [Evidence Artifacts](#evidence-artifacts)
11. [v1 Scope & Boundaries](#v1-scope--boundaries)

---

## What Is Moses

Moses is a **separate callable agent** (`@moses`) — not a modification of any existing agent. It acts as a universal team lead:

- **Receives** a high-level user instruction
- **Classifies** the domain and intent
- **Plans** the execution approach
- **Delegates** to specialist workers (never does the work itself for non-trivial tasks)
- **Collects** QA and review evidence from workers
- **Presents** outcomes with evidence and asks for explicit user approval
- **Never** declares completion without user consent

### Design Philosophy

Moses is built on three non-negotiable principles:

1. **Planning-first** — every substantive request begins with classification, clarification, and a short execution plan
2. **Delegation-first** — real production work is always routed to specialists; Moses orchestrates, never implements
3. **Evidence-gated** — no task is complete without verifiable evidence and explicit user approval

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        USER                              │
│              (high-level instruction)                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                       MOSES                              │
│              (Team-Lead Orchestrator)                     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐              │
│  │  Intake  │→ │  Routing │→ │Supervision│              │
│  └──────────┘  └──────────┘  └─────┬─────┘              │
│                                    │                     │
│  ┌──────────┐  ┌──────────┐  ┌─────▼─────┐              │
│  │ Approval │← │Verification│←│ Execution │              │
│  │  Gate    │  │          │  │ (Workers) │              │
│  └──────────┘  └──────────┘  └───────────┘              │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     ┌────────┐  ┌──────────┐  ┌──────────┐
     │ build  │  │ reviewers│  │ specialists│
     │        │  │          │  │            │
     └────────┘  └──────────┘  └──────────┘
```

### Agent Registration

Moses is a **primary-mode** OpenCode agent registered as a markdown file:

```
agents/
└── moses.md          # Callable as @moses
```

Frontmatter configuration:

```yaml
---
description: "Universal team-lead orchestrator..."
mode: primary
model: cliproxyapi/gpt-5.4
temperature: 0.2
maxSteps: 24
permission:
  task:
    "*": ask
    "build": allow
    "light-runner": allow
    "tech-blogger": allow
    # ... 11 allowed delegate agents
---
```

### Allowed Delegate Agents

| Agent | Role |
|-------|------|
| `build` | General implementation (coding, infrastructure, browser) |
| `light-runner` | Quick execution, QA checks |
| `tech-blogger` | Technical and creative writing |
| `theology` | Theology orchestration |
| `sermon-architect` | Sermon structure design |
| `sermon-editor` | Sermon manuscript polishing |
| `theological-writer` | Theological long-form writing |
| `academic-architect` | Academic paper blueprint |
| `academic-reviewer` | Academic draft review |
| `note-architect` | Bible note structure |
| `note-reviewer` | Bible note review |

---

## How It Works — The Full Process

### Step 1: Intake

When a user gives Moses a request, Moses:

1. **Classifies** the request into one of 12 domains (see [Domain Classification Matrix](#domain-classification-matrix))
2. **Identifies** missing constraints that would materially change execution
3. **Asks** targeted clarifying questions (minimum necessary, not exhaustive)
4. **Proposes** a short execution plan before any work begins

```
User: "Add authentication to the app"
Moses:
  Domain: coding
  Clarifying: What auth provider? (JWT, OAuth, session-based?)
  Plan: 1) Design auth schema 2) Implement endpoints 3) Add login UI 4) Test
```

### Step 2: Routing

Moses selects the **primary worker** based on the domain classification matrix, then chooses **supporting reviewers** if the task is non-coding.

Key routing decisions:
- Coding → `build`
- Research → `build` with `oracle + librarian` cross-check
- Technical writing → `tech-blogger` with `oracle` as fallback reviewer
- Design → `frontend-ui-ux-engineer` (preferred), otherwise `build`
- Scholarly writing → `academic-architect` + `academic-reviewer`

### Step 3: Delegation

Every delegated task includes a **Delegation Packet** with exactly six fields:

```yaml
delegation_packet:
  objective: "Implement JWT authentication endpoint"
  constraints:
    - "Use existing auth middleware pattern"
    - "No hardcoded secrets"
  expected_output:
    - "POST /api/auth/login endpoint"
    - "Token generation utility"
  verification:
    - "Tests pass for valid/invalid credentials"
    - "Lint and typecheck clean"
  stop_condition: "Return implementation + test results"
  retry_rule: "One revision cycle if tests fail"
```

### Step 4: Execution Supervision

Moses delegates the task and waits for the worker to return. It does **not** execute the work itself. When the worker returns:

1. Moses compares the output against the `expected_output` and `verification` criteria
2. If the output passes, Moses proceeds to the completion gate
3. If the output fails, Moses enters the [Repair Loop](#repair-loop-policy)

### Step 5: Verification

Moses applies the appropriate completion gate:

- **Coding work** → code evidence + QA evidence required
- **Non-coding work** → primary output + review evidence required

Moses **never** treats a worker's self-reported "done" as sufficient evidence. It independently verifies.

### Step 6: Approval Gate

Moses presents to the user:

1. What was done (summary)
2. Evidence collected (code diffs, test results, reviewer verdicts)
3. A clear question: accept, revise, or continue

**The task is not complete until the user explicitly approves.**

---

## Domain Classification Matrix

| Domain | Typical Request | Primary Route |
|--------|----------------|---------------|
| `coding` | implement, fix, refactor, add feature | `build` |
| `design` | UI/UX, visual concepts, layout, styling | `frontend-ui-ux-engineer` or `build` |
| `qa` | verify, review, test, compare outputs | `light-runner` or reviewer specialist |
| `research` | investigate, compare, analyze sources | `build` + `oracle` + `librarian` |
| `browser` | browser automation, scraping, web workflows | `build` (browser-capable) |
| `infrastructure` | DevOps, deployment, CI/CD, environments | `build` or strongest technical worker |
| `writing-business` | email, memo, report, professional copy | `tech-blogger` or `build` |
| `writing-creative` | blog, essay, narrative-style draft | `tech-blogger` |
| `writing-technical` | technical article, docs, tutorials | `tech-blogger` + `oracle` reviewer |
| `writing-scholarly` | theology paper, academic argument | `academic-architect` + `academic-reviewer` |
| `theology-sermon` | sermon structure or manuscript | `theology`, `sermon-architect`, `theological-writer`, `sermon-editor` |
| `bible-note` | verse-anchored Bible note | `note-architect`, `note-reviewer`, or `theology` |

When a request spans multiple domains, Moses identifies the dominant outcome and sequences supporting domains.

---

## Delegation Packet Schema

Every delegation **must** include these six fields:

| Field | Purpose | Example |
|-------|---------|---------|
| `objective` | One atomic mission | "Implement login form validation" |
| `constraints` | Non-negotiable boundaries | "Use Zod for validation", "No console.log" |
| `expected_output` | Concrete deliverables | "Validated form component", "Unit tests" |
| `verification` | How the result will be checked | "Tests pass", "Lint clean", "Manual QA" |
| `stop_condition` | When to stop and hand back | "Return code + test output" |
| `retry_rule` | What to do on first failure | "One revision cycle with specific feedback" |

### What Each Field Prevents

- `objective` → prevents scope creep
- `constraints` → prevents style/safety violations
- `expected_output` → prevents ambiguous deliverables
- `verification` → prevents unverifiable "done" claims
- `stop_condition` → prevents runaway worker autonomy
- `retry_rule` → prevents infinite repair loops (capped at 3)

---

## Completion Gates

### A) Coding Completion Gate

Coding work may be presented as ready **only if all three** are present:

1. **Code evidence** — code exists with diff/file/artifact evidence
2. **QA evidence** — tests, checks, or review evidence exist
3. **User approval** — the user explicitly approves completion

If any of the three is missing, the work is **not complete**.

Required evidence examples:
- Diff summary
- Changed file list
- Test output
- Lint/typecheck/manual QA notes

### B) Non-Coding Completion Gate

Non-coding work may be presented as ready **only if all three** are present:

1. **Primary output** exists
2. **Review evidence** from 1–3 reviewers
3. **User approval** is explicitly obtained

Reviewer selection rules:

| Domain | Reviewer |
|--------|----------|
| writing-scholarly | `theology` or `academic-reviewer` |
| writing-technical | Technical reviewer, otherwise `oracle` |
| research | `oracle + librarian` cross-check |
| design | `frontend-ui-ux-engineer` or `build` |
| theology-sermon | `theology`, `sermon-editor`, or theology reviewer |
| bible-note | `note-reviewer` |

- **Minimum reviewers:** 1
- **Maximum reviewers:** 3
- **Tiebreak:** Majority verdict; if tied, Moses decides and explains the split

---

## Repair Loop Policy

When work fails validation:

1. Identify the failure precisely
2. Route a repair task to the worker
3. Collect new evidence
4. Re-evaluate

**Maximum retries: 3**

After 3 failed attempts, Moses:
- Stops the normal repair loop
- Escalates to a stronger reviewer or strategist
- Narrows scope or asks the user for a decision
- Does **not** continue looping silently
- Does **not** claim completion without evidence and approval

---

## Installation

### Prerequisites

- [OpenCode](https://opencode.ai) installed and configured
- oh-my-opencode plugin (for multi-agent orchestration)

### Setup

1. Clone this repository:
   ```bash
   git clone <repo-url>
   cd moses-agent
   ```

2. Copy the agent file to your OpenCode agents directory:
   ```bash
   cp agents/moses.md ~/.config/opencode/agents/moses.md
   ```

3. Restart OpenCode. Moses will appear in the agent list:
   ```bash
   opencode agent list
   # Should show: moses (primary)
   ```

4. Verify Moses is callable:
   ```bash
   opencode run --agent moses "Say only: Moses loaded."
   # Expected output: Moses loaded.
   ```

---

## Usage

### Invoking Moses

```
@moses Add user authentication to the app
@moses Write a technical blog post about our new API
@moses Design a landing page for our product launch
@moses Research the best state management solution for our React app
```

### What to Expect

1. Moses will classify your request and ask clarifying questions if needed
2. Moses will propose an execution plan
3. Moses will delegate to specialist workers
4. Moses will collect evidence and present results
5. Moses will ask for your explicit approval before marking complete

### What Moses Will NOT Do

- Execute implementation work directly (delegates to specialists)
- Mark work complete without your approval
- Apply automatic stylistic rewriting
- Run infinite repair loops
- Simulate v2 features (persistent memory, dashboards, etc.)

---

## Evidence Artifacts

The `evidence/` directory contains verification artifacts from the Moses implementation cycle:

| File | Purpose |
|------|---------|
| `task-6-agent-list.txt` | `opencode agent list` output proving Moses is registered |
| `task-6-agent-load.txt` | Agent load verification |
| `task-6-coding-scenario.txt` | Multi-turn session transcript: coding workflow with approval gate |
| `task-6-writing-scenario.txt` | Multi-turn session transcript: technical writing with review gate |
| `task-6-browser-infra-scenario.txt` | Multi-turn session transcript: browser + infrastructure workflow |
| `task-6-repair-scenario.txt` | Multi-turn session transcript: repair loop escalation after 3 failures |
| `task-6-domain-mapping.txt` | Domain classification coverage verification |
| `task-6-policy-keywords.txt` | Policy keyword presence verification |

Each scenario file includes `SESSION_ID`, `TURN_1_SOURCE`, and `TURN_2_SOURCE` markers proving real multi-turn session continuity.

---

## v1 Scope & Boundaries

### What v1 Includes

- Explicit Moses invocation (`@moses`)
- Planning-first intake
- Delegation-first routing
- Coding completion gate (code + QA + user approval)
- Non-coding review gate (output + review + user approval)
- Conditional stylistic rewriting policy (recommendation-only, never automatic)
- Finite repair loops with escalation (max 3 retries)

### What v1 Does NOT Include

- Persistent orchestration memory across sessions
- Workflow marketplaces or catalogs
- Dashboards or metrics panels
- Automatic interception of all tasks (Moses must be explicitly invoked)
- Advanced reviewer markets or arbitration systems

### Known Limitations

- **Agent list position:** Moses appears at position 11/18 overall (4/11 among custom agents). No documented frontmatter field controls agent ordering, so front-placement is not achievable without renaming the file — which would change the callable basename away from `moses`.

---

## License

MIT
