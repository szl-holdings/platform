#!/usr/bin/env tsx
/**
 * configure-ouroboros-docs-bypass.ts
 *
 * Machine-verifiable configuration for the docs-only automation bypass on
 * `szl-holdings/ouroboros-thesis` (task #5039).
 *
 * Goal: let single-account automation flows (e.g. the post-release DOI /
 * Zenodo citation backfill) merge their own pull request without a second
 * human approver — but only when the PR touches documentation / citation
 * paths, and only when every existing status check still passes.
 *
 * This script is the single source of truth for that policy. It can:
 *   - `verify`   read the current GitHub state and check it matches DESIRED
 *   - `provision-team`
 *                create the `docs-automation` org team and grant it push
 *                access to the repo (idempotent)
 *   - `push-workflow`
 *                add `.github/workflows/docs-only-paths-guard.yml` on a
 *                feature branch and open a PR for human review
 *                (requires GITHUB_TOKEN with the `workflow` scope)
 *   - `activate` once the workflow is merged on main, register the team as
 *                a bypass actor on ruleset `series-a-default-branch` and
 *                add the new check to required_status_checks
 *   - `revoke`   remove the team from bypass_actors (emergency stop)
 *
 * Activation is split from provisioning so that the bypass is NEVER live
 * without the docs-only path guard being enforced.
 *
 * Auth: set GITHUB_TOKEN to a token with `repo`, `admin:org`, and (for
 * `push-workflow` only) `workflow` scopes.
 */

const OWNER = "szl-holdings";
const REPO = "ouroboros-thesis";
const RULESET_ID = 16195489;
const RULESET_NAME = "series-a-default-branch";
const TEAM_SLUG = "docs-automation";
const TEAM_DESCRIPTION =
  "Single-purpose team for docs-only PR merge bypass on " +
  "ouroboros-thesis (task #5039). Members must be automation accounts only.";

const GUARD_WORKFLOW_PATH = ".github/workflows/docs-only-paths-guard.yml";
const GUARD_CHECK_CONTEXT = "Docs-only paths guard / docs-only-paths";

// Allowlist of file path prefixes / patterns the bypass actor may touch.
// Mirrored exactly in the workflow YAML below so the policy text and the
// runtime gate cannot drift.
export const DOCS_ALLOWLIST_REGEX =
  "^(docs/|paper/|papers/|research/|CITATION\\.cff$|CHANGELOG\\.md$|" +
  "README\\.md$|\\.zenodo\\.json$|codemeta\\.json$|.*\\.md$|.*\\.bib$)";

export const GUARD_WORKFLOW_YAML = `name: Docs-only paths guard

# Enforces that any PR which is eligible to use the automation bypass on
# the 'series-a-default-branch' ruleset only touches documentation /
# citation paths. The check identifies bypass-eligible PRs by looking up
# the PR author's membership in the '${TEAM_SLUG}' org team — using
# actual identity rather than the easily-spoofable 'Bot' user type — so
# the guard fires for every account that could exercise the bypass and
# only those accounts.
#
# This check is referenced by ruleset id ${RULESET_ID} as a required
# status check so the bypass cannot be used to land non-docs changes
# without review.

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: read

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  docs-only-paths:
    name: docs-only-paths
    runs-on: ubuntu-latest
    steps:
      - name: Determine if PR author is bypass-eligible
        id: author
        env:
          GH_TOKEN: \${{ secrets.DOCS_AUTOMATION_TEAM_READ_TOKEN || github.token }}
          PR_AUTHOR_LOGIN: \${{ github.event.pull_request.user.login }}
        run: |
          set -euo pipefail
          # Query team membership using a token that has 'read:org' on
          # ${OWNER}. The default GITHUB_TOKEN cannot read team membership,
          # so a fine-grained PAT or GitHub App installation token with
          # only that scope must be exposed as DOCS_AUTOMATION_TEAM_READ_TOKEN.
          status=\$(
            curl -sS -o /tmp/member.json -w '%{http_code}' \\
              -H "Authorization: Bearer \${GH_TOKEN}" \\
              -H "Accept: application/vnd.github+json" \\
              -H "X-GitHub-Api-Version: 2022-11-28" \\
              "https://api.github.com/orgs/${OWNER}/teams/${TEAM_SLUG}/memberships/\${PR_AUTHOR_LOGIN}"
          )
          case "\${status}" in
            200)
              role=\$(jq -r '.state + ":" + .role' /tmp/member.json)
              if [ "\${role%%:*}" = "active" ]; then
                echo "PR author \${PR_AUTHOR_LOGIN} is an active member of ${TEAM_SLUG}; guard will enforce."
                echo "enforce=true" >> "\$GITHUB_OUTPUT"
              else
                echo "PR author membership state is \${role}; treating as non-member."
                echo "enforce=false" >> "\$GITHUB_OUTPUT"
              fi
              ;;
            404)
              echo "PR author \${PR_AUTHOR_LOGIN} is not in ${TEAM_SLUG}; guard does not apply."
              echo "enforce=false" >> "\$GITHUB_OUTPUT"
              ;;
            401|403)
              echo "::error::Cannot read ${TEAM_SLUG} membership (HTTP \${status}). DOCS_AUTOMATION_TEAM_READ_TOKEN must have read:org on ${OWNER}."
              exit 1
              ;;
            *)
              echo "::error::Unexpected response (\${status}) while checking team membership."
              cat /tmp/member.json
              exit 1
              ;;
          esac

      - name: Checkout
        if: steps.author.outputs.enforce == 'true'
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          fetch-depth: 0

      - name: Verify only docs/citation paths are touched
        if: steps.author.outputs.enforce == 'true'
        env:
          BASE_SHA: \${{ github.event.pull_request.base.sha }}
          HEAD_SHA: \${{ github.event.pull_request.head.sha }}
        run: |
          set -euo pipefail
          mapfile -t CHANGED < <(git diff --name-only "\${BASE_SHA}" "\${HEAD_SHA}")
          ALLOW_RE='${DOCS_ALLOWLIST_REGEX}'
          BAD=()
          for f in "\${CHANGED[@]}"; do
            if [[ ! "\$f" =~ \$ALLOW_RE ]]; then
              BAD+=("\$f")
            fi
          done
          if [ "\${#BAD[@]}" -gt 0 ]; then
            echo "::error::Bypass-eligible PR touches non-docs paths; bypass is not permitted."
            printf '::error::  %s\\n' "\${BAD[@]}"
            exit 1
          fi
          echo "All changed paths are within the docs/citation allowlist."
`;

interface GhResponse<T = unknown> {
  status: number;
  body: T;
}

async function gh<T = unknown>(
  path: string,
  opts: RequestInit = {},
): Promise<GhResponse<T>> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN env var is required");
  }
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body: body as T };
}

interface BypassActor {
  actor_id: number;
  actor_type: string;
  bypass_mode: string;
}

interface Ruleset {
  id: number;
  name: string;
  bypass_actors: BypassActor[];
  rules: Array<{
    type: string;
    parameters?: {
      required_status_checks?: Array<{ context: string }>;
      [k: string]: unknown;
    };
  }>;
  conditions: unknown;
  target: string;
  enforcement: string;
}

async function getRuleset(): Promise<Ruleset> {
  const r = await gh<Ruleset>(`/repos/${OWNER}/${REPO}/rulesets/${RULESET_ID}`);
  if (r.status !== 200) {
    throw new Error(`get ruleset failed: ${r.status} ${JSON.stringify(r.body)}`);
  }
  return r.body;
}

async function getTeamId(): Promise<number | null> {
  const r = await gh<{ id: number }>(`/orgs/${OWNER}/teams/${TEAM_SLUG}`);
  if (r.status === 404) return null;
  if (r.status !== 200) {
    throw new Error(`get team failed: ${r.status} ${JSON.stringify(r.body)}`);
  }
  return r.body.id;
}

// --- commands ----------------------------------------------------------

async function provisionTeam(): Promise<number> {
  let id = await getTeamId();
  if (id == null) {
    const r = await gh<{ id: number }>(`/orgs/${OWNER}/teams`, {
      method: "POST",
      body: JSON.stringify({
        name: TEAM_SLUG,
        description: TEAM_DESCRIPTION,
        privacy: "closed",
      }),
    });
    if (r.status !== 201) {
      throw new Error(`create team failed: ${r.status} ${JSON.stringify(r.body)}`);
    }
    id = r.body.id;
    console.log(`created team ${TEAM_SLUG} (id=${id})`);
  } else {
    console.log(`team ${TEAM_SLUG} already exists (id=${id})`);
  }

  const grant = await gh(
    `/orgs/${OWNER}/teams/${TEAM_SLUG}/repos/${OWNER}/${REPO}`,
    { method: "PUT", body: JSON.stringify({ permission: "push" }) },
  );
  if (grant.status !== 204) {
    throw new Error(`grant access failed: ${grant.status} ${JSON.stringify(grant.body)}`);
  }
  console.log(`granted ${TEAM_SLUG} push access to ${OWNER}/${REPO}`);
  return id;
}

async function pushWorkflowPr(): Promise<void> {
  const repoInfo = await gh<{ default_branch: string }>(
    `/repos/${OWNER}/${REPO}`,
  );
  const defaultBranch = repoInfo.body.default_branch;
  const baseRef = await gh<{ object: { sha: string } }>(
    `/repos/${OWNER}/${REPO}/git/ref/heads/${defaultBranch}`,
  );
  const baseSha = baseRef.body.object.sha;
  const baseCommit = await gh<{ tree: { sha: string } }>(
    `/repos/${OWNER}/${REPO}/git/commits/${baseSha}`,
  );

  const branch = "task-5039/docs-only-paths-guard-workflow";
  const branchRef = await gh(`/repos/${OWNER}/${REPO}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
  });
  if (branchRef.status !== 201 && branchRef.status !== 422) {
    throw new Error(`branch create failed: ${branchRef.status} ${JSON.stringify(branchRef.body)}`);
  }

  const blob = await gh<{ sha: string }>(`/repos/${OWNER}/${REPO}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({
      content: GUARD_WORKFLOW_YAML,
      encoding: "utf-8",
    }),
  });
  const tree = await gh<{ sha: string }>(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseCommit.body.tree.sha,
      tree: [
        {
          path: GUARD_WORKFLOW_PATH,
          mode: "100644",
          type: "blob",
          sha: blob.body.sha,
        },
      ],
    }),
  });
  if (tree.status !== 201) {
    throw new Error(
      `tree create failed (does GITHUB_TOKEN have the 'workflow' scope?): ` +
        `${tree.status} ${JSON.stringify(tree.body)}`,
    );
  }
  const commit = await gh<{ sha: string }>(
    `/repos/${OWNER}/${REPO}/git/commits`,
    {
      method: "POST",
      body: JSON.stringify({
        message:
          "ci: add docs-only paths guard for automation bypass\n\n" +
          "Required status check for the docs-automation bypass actor on\n" +
          `ruleset ${RULESET_ID}. Refs task #5039.`,
        tree: tree.body.sha,
        parents: [baseSha],
      }),
    },
  );
  await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.body.sha, force: false }),
  });
  const pr = await gh<{ number: number; html_url: string }>(
    `/repos/${OWNER}/${REPO}/pulls`,
    {
      method: "POST",
      body: JSON.stringify({
        title: "ci: add docs-only paths guard (task #5039)",
        head: branch,
        base: defaultBranch,
        body:
          "Adds the path guard required by the docs-only automation " +
          "bypass policy. After merge, run `scripts/github/" +
          "configure-ouroboros-docs-bypass.ts activate` to enable the " +
          "bypass.",
      }),
    },
  );
  console.log(`opened PR #${pr.body.number}: ${pr.body.html_url}`);
}

async function activate(): Promise<void> {
  // Preconditions, in order:
  //   (a) the guard workflow file exists on main,
  //   (b) at least one check run named GUARD_CHECK_CONTEXT has completed
  //       on the main branch with conclusion === "success",
  //   (c) the docs-automation team exists.
  // (b) is the important one — without it, the guard could be a no-op
  // (broken YAML, wrong job name, missing secret) and adding the check
  // to required_status_checks would deadlock the branch.
  const file = await gh(
    `/repos/${OWNER}/${REPO}/contents/${GUARD_WORKFLOW_PATH}?ref=main`,
  );
  if (file.status !== 200) {
    throw new Error(
      `cannot activate: ${GUARD_WORKFLOW_PATH} is not present on main ` +
        `(status ${file.status}). Run push-workflow first and merge the PR.`,
    );
  }
  // The guard's `on: pull_request` trigger means it does not run on push
  // events to main, so we look at the workflow's own recent run history
  // (which includes the PR that introduced the guard).
  const workflowFile = GUARD_WORKFLOW_PATH.split("/").pop()!;
  const wfRuns = await gh<{
    workflow_runs: Array<{
      conclusion: string | null;
      status: string;
      head_branch: string;
      created_at: string;
    }>;
  }>(
    `/repos/${OWNER}/${REPO}/actions/workflows/${workflowFile}/runs?per_page=20`,
  );
  const successfulRun = (wfRuns.body.workflow_runs ?? []).find(
    (r) => r.status === "completed" && r.conclusion === "success",
  );
  if (!successfulRun) {
    throw new Error(
      `cannot activate: no successful run of '${workflowFile}' observed. ` +
        `Trigger the guard at least once (e.g. via a docs-only PR) and ` +
        `re-run activate.`,
    );
  }
  const teamId = await getTeamId();
  if (teamId == null) {
    throw new Error("cannot activate: docs-automation team does not exist. Run provision-team first.");
  }

  const current = await getRuleset();
  const rules = current.rules.map((r) => {
    if (r.type !== "required_status_checks" || !r.parameters?.required_status_checks) {
      return r;
    }
    const checks = r.parameters.required_status_checks;
    const hasGuard = checks.some((c) => c.context === GUARD_CHECK_CONTEXT);
    return hasGuard
      ? r
      : {
          ...r,
          parameters: {
            ...r.parameters,
            required_status_checks: [
              ...checks,
              { context: GUARD_CHECK_CONTEXT },
            ],
          },
        };
  });
  const bypass = current.bypass_actors.filter(
    (b) => !(b.actor_type === "Team" && b.actor_id === teamId),
  );
  bypass.push({
    actor_id: teamId,
    actor_type: "Team",
    bypass_mode: "pull_request",
  });

  const r = await gh(`/repos/${OWNER}/${REPO}/rulesets/${RULESET_ID}`, {
    method: "PUT",
    body: JSON.stringify({
      name: RULESET_NAME,
      target: current.target,
      enforcement: current.enforcement,
      conditions: current.conditions,
      bypass_actors: bypass,
      rules,
    }),
  });
  if (r.status !== 200) {
    throw new Error(`activate failed: ${r.status} ${JSON.stringify(r.body)}`);
  }
  console.log("activated docs-only automation bypass");
}

async function revoke(): Promise<void> {
  const teamId = await getTeamId();
  const current = await getRuleset();
  const bypass = current.bypass_actors.filter(
    (b) => !(b.actor_type === "Team" && teamId != null && b.actor_id === teamId),
  );
  const r = await gh(`/repos/${OWNER}/${REPO}/rulesets/${RULESET_ID}`, {
    method: "PUT",
    body: JSON.stringify({
      name: RULESET_NAME,
      target: current.target,
      enforcement: current.enforcement,
      conditions: current.conditions,
      bypass_actors: bypass,
      rules: current.rules,
    }),
  });
  if (r.status !== 200) {
    throw new Error(`revoke failed: ${r.status} ${JSON.stringify(r.body)}`);
  }
  console.log("revoked docs-only automation bypass");
}

async function verify(): Promise<void> {
  const teamId = await getTeamId();
  const ruleset = await getRuleset();
  const workflow = await gh(
    `/repos/${OWNER}/${REPO}/contents/${GUARD_WORKFLOW_PATH}?ref=main`,
  );

  const hasTeam = teamId != null;
  const hasWorkflow = workflow.status === 200;
  const requiredChecks =
    ruleset.rules.find((r) => r.type === "required_status_checks")?.parameters
      ?.required_status_checks ?? [];
  const guardIsRequired = requiredChecks.some(
    (c) => c.context === GUARD_CHECK_CONTEXT,
  );
  const bypassActive = ruleset.bypass_actors.some(
    (b) => b.actor_type === "Team" && teamId != null && b.actor_id === teamId,
  );

  const safe =
    !bypassActive ||
    (bypassActive && hasWorkflow && guardIsRequired && hasTeam);

  console.log(
    JSON.stringify(
      {
        hasTeam,
        teamId,
        hasWorkflow,
        guardIsRequired,
        bypassActive,
        safeConfiguration: safe,
        bypassActors: ruleset.bypass_actors,
        requiredStatusChecks: requiredChecks.map((c) => c.context),
      },
      null,
      2,
    ),
  );

  if (!safe) {
    console.error(
      "UNSAFE: bypass is active but the docs-only guard is not enforced.",
    );
    process.exit(1);
  }
}

async function main() {
  const cmd = process.argv[2];
  switch (cmd) {
    case "provision-team":
      await provisionTeam();
      break;
    case "push-workflow":
      await pushWorkflowPr();
      break;
    case "activate":
      await activate();
      break;
    case "revoke":
      await revoke();
      break;
    case "verify":
      await verify();
      break;
    default:
      console.error(
        "usage: configure-ouroboros-docs-bypass.ts " +
          "<verify|provision-team|push-workflow|activate|revoke>",
      );
      process.exit(2);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
