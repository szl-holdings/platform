# Workflow security repair — reconciled 2026-10-13

The original October 5 candidate repaired CodeQL merge-ref selection and pagination together with the post-deployment smoke checkout. Current main already contains a stronger CodeQL gate: exact synthetic merge-ref binding, complete pagination, alert schema validation, duplicate rejection, and an independent contract check. This reconciliation retains that complete implementation and its tests without replacement.

Remaining repair: GitHub Actions must evaluate the deploy SHA as an expression in checkout's `with.ref`. A bare shell variable is literal there. Use `${{ env.WORKFLOW_RUN_HEAD_SHA }}` and disable credential persistence. The existing environment expression continues to select the triggering deployment SHA, falling back to `github.sha` for manual dispatch.

A focused checkout regression is added to the existing release-security workflow contract suite, which already runs in the independent CodeQL contract job. No job permission, trigger, deployment target, runtime secret, CodeQL severity threshold, or protected-branch control changes.

Validation is recorded in the reconciliation commit. Hosted exact-head checks must finish before normal squash admission. These source checks do not establish a successful production deployment or a live smoke run.

Rollback: reviewed revert of the smoke checkout and regression changes.
