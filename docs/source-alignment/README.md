# GitHub ↔ Hugging Face source alignment

This registry defines how SZL Holdings source code and Hugging Face artifacts
relate.

GitHub \`szl-holdings\` is the canonical source for Python backends, frontends,
tests, workflows, and release metadata. Hugging Face \`SZLHOLDINGS\` contains
runtime mirrors, model releases, and evidence/data artifacts. A Hugging Face
repository is not an independent source tree unless a component explicitly
documents that contract.

## Canonical application sources

| Component | GitHub source | Backend | Frontend | Hugging Face target |
|---|---|---|---|---|
| platform | [platform](https://github.com/szl-holdings/platform) | \`apps/*\`, \`packages/*\` Python services | pnpm/TypeScript workspace | shared substrate consumed by flagships |
| a11oy | [a11oy](https://github.com/szl-holdings/a11oy) | \`serve.py\`, \`oro/api.py\`, \`a11oy_markets.py\` | \`web/\` | [a11oy Space](https://huggingface.co/spaces/SZLHOLDINGS/a11oy) |
| david-leads | [david-leads](https://github.com/szl-holdings/david-leads) | \`backend/\`, \`app/server.py\` | \`app/static/\`, \`backend/static/\` | [david-leads Space](https://huggingface.co/spaces/SZLHOLDINGS/david-leads) |
| szl-frontier | [szl-frontier](https://github.com/szl-holdings/szl-frontier) | \`python/\` | TypeScript/Vite application | [szl-frontier Space](https://huggingface.co/spaces/SZLHOLDINGS/szl-frontier) |
| szl-command-lab | [szl-command-lab](https://github.com/szl-holdings/szl-command-lab) | Python gateway/server | TypeScript/Vite application | [szl-command-lab Space](https://huggingface.co/spaces/SZLHOLDINGS/szl-command-lab) |

The registry is intentionally scoped to components with observed application
source. Libraries, proof repositories, datasets, and retired projects remain
in their own repositories and are not forced to grow a frontend/backend.

## Alignment rules

1. Build and test from the reviewed GitHub revision.
2. Record the exact GitHub SHA in the runtime or artifact witness.
3. Publish to Hugging Face only through the repository-owned workflow.
4. Keep model and dataset cards explicit about lineage, evidence class, and
   what the artifact does not prove.
5. Treat HTTP reachability as availability evidence only; it is not source
   parity or production readiness.
6. Never copy secrets, credentials, private databases, or unreviewed weights.

Run the structural check with:

\`\`\`bash
python tools/validate_source_alignment.py
\`\`\`

This registry does not authorize a merge, publication, deployment, or model
release. Those actions remain subject to repository checks and the existing
protected release gates.
