# Subagent Refactor Plan

This working note keeps the bundled subagent model aligned with the control-plane-first prompt contract and the public docs.

It is intentionally short: the goal is to keep the refactor direction easy to scan while still preserving the approved control-plane model. The note tracks the few principles that should stay stable as prompts and public documentation continue to evolve.

## Refactor principles

- Preserve Moses as the user-facing control plane, not a direct execution worker.
- Keep bundled `moses-*` roles as the default internal team for planner/explorer/librarian/implementer/reviewer/validator/runner work.
- Use discovery to find callable availability plus skills/tools/MCPs, not to invent a new team model on each task.
- Keep delegation explicit so downstream workers receive small, concrete packets rather than broad intent.
- Keep review and validation as mandatory gates before completion.

## Approved vNext direction

- Moses is planner / orchestrator / communicator only.
- The bundled `moses-*` team is the default internal worker graph.
- Discovery focuses on callable availability plus skills/tools/MCPs, not on inventing a new team model each time.
- Planning now produces both an internal detailed plan and a user-facing approval summary.
- Downstream cheap workers must receive highly explicit delegation packets.
- Review and validation remain mandatory gates before completion.
