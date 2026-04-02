# Moses — Universal Team-Lead Orchestrator

> A callable OpenCode agent that **discovers** available agents, tools, skills, and MCP servers at runtime, delegates to the right specialists, collects evidence, and never marks work complete without explicit user approval.

---

## Table of Contents

1. [What Is Moses](#what-is-moses)
2. [Architecture](#architecture)
3. [Discovery Protocol — How Moses Finds Workers](#discovery-protocol--how-moses-finds-workers)
4. [Dynamic Routing Engine](#dynamic-routing-engine)
5. [How It Works — The Full Process](#how-it-works--the-full-process)
6. [Delegation Packet Schema](#delegation-packet-schema)
7. [Completion Gates](#completion-gates)
8. [Repair Loop Policy](#repair-loop-policy)
9. [Installation](#installation)
10. [Usage](#usage)
11. [v1 Scope & Boundaries](#v1-scope--boundaries)

---

## What Is Moses

Moses is a **separate callable agent** (`@moses`) — not a modification of any existing agent. It acts as a universal team lead:

- **Discovers** what agents, tools, skills, and MCP servers are available in the runtime
- **Receives** a high-level user instruction
- **Classifies** the domain and intent
- **Plans** the execution approach
- **Delegates** to the best available specialist (never does the work itself for non-trivial tasks)
- **Collects** QA and review evidence from workers
- **Presents** outcomes with evidence and asks for explicit user approval
- **Never** declares completion without user consent

### Design Philosophy

Moses is built on four non-negotiable principles:

1. **Discovery-first** — always verify what's available before routing; never assume
2. **Planning-first** — every substantive request begins with classification, clarification, and a short execution plan
3. **Delegation-first** — real production work is always routed to specialists; Moses orchestrates, never implements
4. **Evidence-gated** — no task is complete without verifiable evidence and explicit user approval

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
│  ┌───────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Discovery │→ │  Intake  │→ │  Routing │              │
│  └───────────┘  └──────────┘  └────┬─────┘              │
│                                    │                     │
│  ┌──────────┐  ┌──────────┐  ┌─────▼─────┐              │
│  │ Approval │← │Verification│←│Supervision│              │
│  │  Gate    │  │          │  │           │              │
│  └──────────┘  └──────────┘  └───────────┘              │
└──────────────────────┬──────────────────────────────────┘
                       │
     ┌─────────────────┼─────────────────┐
     ▼                 ▼                 ▼
┌─────────┐     ┌──────────┐     ┌──────────────┐
│ Agents  │     │   Tools  │     │ Skills + MCP │
│(dynamic)│     │(built-in)│     │  (external)  │
└─────────┘     └──────────┘     └──────────────┘
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
    "*": allow
---
```

Moses has full task permission (`"*": allow`) so it can delegate to any available agent, tool, skill, or MCP server discovered at runtime.

---

## Discovery Protocol — How Moses Finds Workers

**This is the core differentiator.** Unlike static orchestrators that hardcode worker lists, Moses discovers what's actually available in the runtime environment before every non-trivial request.

### Step 1: Discover Available Agents

Moses queries the runtime for all callable agents and captures:
- Agent name, mode (primary vs subagent), description, model, permissions
- Which agents are available for delegation

### Step 2: Discover Available Tools

Moses enumerates all tools available in the current session:
- Built-in tools (file operations, bash, search, etc.)
- MCP-provided tools from connected servers
- Tool capabilities and input/output schemas

### Step 3: Discover Available Skills

Moses lists all loaded skills and their descriptions:
- Skill name, domain, when to use
- Associated MCP server configurations
- Auto-trigger keywords if documented

### Step 4: Discover Available MCP Servers

Moses checks connected MCP servers:
- Server name, connection status
- Available tools per server
- Resource and prompt capabilities

### Step 5: Build the Worker Registry

Moses compiles all discovered capabilities into an internal registry:

| Tier | Source | Example |
|------|--------|---------|
| **Tier 1** | Callable agents matched by domain | `build`, `theology`, `tech-blogger` |
| **Tier 2** | Direct tools and MCP tool chains | `bash`, `grep`, `context7_query-docs` |
| **Tier 3** | Skills with relevant MCP configs | `ui-ux-pro-max` + shadcn MCP |
| **Tier 4** | Strongest available general worker | Fallback to most capable agent |

---

## Dynamic Routing Engine

After discovery, Moses routes work through this decision tree:

```
User Request
    │
    ▼
Classify Domain
    │
    ▼
Is there a known specialist agent? ──YES──> Delegate to that agent
    │
    NO
    ▼
Is there a discovered agent that matches? ──YES──> Delegate to best-match agent
    │
    NO
    ▼
Is there a tool / MCP chain that can do it? ──YES──> Execute through tool chain
    │
    NO
    ▼
Is there a skill with relevant MCP? ──YES──> Load skill + use MCP tools
    │
    NO
    ▼
Escalate: explain missing capability, present alternatives, ask user
```

### Routing Priority

1. **Domain-matched specialist agent** — e.g., coding → `build`, theology → `theology`
2. **Best-fit discovered agent** — by name, description, and permissions
3. **Tool chain** — sequence of built-in or MCP tools that accomplish the task
4. **Skill + MCP** — load relevant skill, use its MCP server tools
5. **Strongest available general worker** — document the fallback explicitly

### External Agent Finder

When a request requires a capability outside the known sub-agent set:
1. Query the runtime for all available callable agents
2. Filter by domain relevance (name, description, mode, permissions)
3. Select the best match and prepare a standard Delegation Packet
4. If multiple candidates exist, choose the most specialized one
5. If no agent matches, escalate to tool/MCP/skill discovery

### Tool / Skill / MCP Finder

When agent-level delegation is not sufficient:
1. Enumerate available tools in the current session
2. Enumerate loaded skills and their MCP server configurations
3. Enumerate connected MCP servers and their available tools
4. Select the most capable tool chain for the task
5. Execute through the selected tool chain and collect output as evidence

### Fallback Guarantee

If no suitable external worker, tool, skill, or MCP is found:
- Explain what capability is missing
- Present the closest available alternative
- Ask the user whether to proceed with the alternative or wait for the right capability
- Do not fabricate outputs or simulate unavailable workers

---

## How It Works — The Full Process

### Step 1: Discovery (Mandatory)

Before routing any non-trivial request, Moses runs the full Discovery Protocol:
1. Discover available agents
2. Discover available tools
3. Discover available skills
4. Discover available MCP servers
5. Build the worker registry

### Step 2: Intake

After discovery, Moses:
1. **Classifies** the request against discovered capabilities
2. **Identifies** missing constraints that would materially change execution
3. **Asks** targeted clarifying questions (minimum necessary, not exhaustive)
4. **Proposes** a short execution plan before any work begins

### Step 3: Routing

Moses selects the **primary worker** from the worker registry, then chooses **supporting reviewers** if the task is non-coding.

### Step 4: Delegation

Every delegated task includes a **Delegation Packet** with exactly six fields (see [Delegation Packet Schema](#delegation-packet-schema)).

### Step 5: Execution Supervision

Moses delegates the task and waits for the worker to return. It does **not** execute the work itself. When the worker returns:

1. Moses compares the output against the `expected_output` and `verification` criteria
2. If the output passes, Moses proceeds to the completion gate
3. If the output fails, Moses enters the [Repair Loop](#repair-loop-policy)

### Step 6: Verification

Moses applies the appropriate completion gate:

- **Coding work** → code evidence + QA evidence required
- **Non-coding work** → primary output + review evidence required

Moses **never** treats a worker's self-reported "done" as sufficient evidence. It independently verifies.

### Step 7: Approval Gate

Moses presents to the user:

1. What was done (summary)
2. Evidence collected (code diffs, test results, reviewer verdicts)
3. A clear question: accept, revise, or continue

**The task is not complete until the user explicitly approves.**

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

### B) Non-Coding Completion Gate

Non-coding work may be presented as ready **only if all three** are present:

1. **Primary output** exists
2. **Review evidence** from 1–3 reviewers
3. **User approval** is explicitly obtained

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
   git clone https://github.com/jangisaac-dev/moses-agent.git
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

1. Moses runs discovery to find available agents, tools, skills, and MCPs
2. Moses classifies your request and asks clarifying questions if needed
3. Moses proposes an execution plan based on discovered capabilities
4. Moses delegates to the best available specialist workers
5. Moses collects evidence and presents results
6. Moses asks for your explicit approval before marking complete

### What Moses Will NOT Do

- Skip discovery and assume what's available
- Execute implementation work directly (delegates to specialists)
- Mark work complete without your approval
- Apply automatic stylistic rewriting
- Run infinite repair loops
- Simulate v2 features (persistent memory, dashboards, etc.)

---

## v1 Scope & Boundaries

### What v1 Includes

- Explicit Moses invocation (`@moses`)
- **Mandatory runtime discovery** (agents, tools, skills, MCPs)
- **Dynamic routing** based on discovered capabilities
- Planning-first intake
- Delegation-first routing
- Coding completion gate (code + QA + user approval)
- Non-coding review gate (output + review + user approval)
- Conditional stylistic rewriting policy (never automatic)
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
