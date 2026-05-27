---
name: Replit container reaps detached background processes
description: setsid/nohup/disown don't keep node processes alive long enough for multi-minute LLM evals; use a workflow or sync foreground batches.
---

In this Replit container, even with `setsid bash -c '... &' & disown`, a node child process running a long Anthropic eval dies silently within ~60–120s, leaving only the early stdout that flushed before the kill. `pgrep` shows nothing after the reap; no SIGTERM trace; not OOM.

**Why:** the container has aggressive parent-reaper behaviour for processes that are not children of a Replit-managed workflow. Detached doesn't help because the reaper walks the cgroup, not the parent tree.

**How to apply:**
- For one-shot long jobs that exceed the 120s tool timeout: split into smaller sync batches that each fit inside one tool call, OR register a Replit workflow (which is lifecycle-managed and survives).
- Always have the job write per-unit results to disk *as each unit finishes* (not only at the end), so a kill leaves a usable partial trail you can resume from.
- Run 6+ small batches in parallel as separate tool calls instead of one big batch — each call is its own process and they all run concurrently in different shells.
