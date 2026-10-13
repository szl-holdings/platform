# A11oy terminal CLI

Repository-local commands for the A11oy active prototype. Provider configuration,
successful inference, source publication and deployment are separate evidence states.

## Windows source launcher

With the workspace dependencies already installed, PowerShell 7.3+ and Node 24+:

```powershell
# From the repository root; no arguments displays help.
pwsh -NoLogo -NoProfile -File packages/a11oy-cli/a11oy-atelier.ps1
pwsh -NoLogo -NoProfile -File packages/a11oy-cli/a11oy-atelier.ps1 weave --help
```

From another directory, use the absolute path to this checkout's
`packages/a11oy-cli/a11oy-atelier.ps1`. The launcher resolves source relative to
itself, not the caller's directory. It does not need the generated
`dist/atelier-cli.js` bin, and it does not install dependencies, alter PATH or
shell/terminal profiles, start a backend, or automatically submit a prompt.

Invoke normally, not by dot-sourcing. Missing prerequisites exit 2. CLI exit codes
and the caller's current directory are preserved; arguments are forwarded without
command-string evaluation. Direct dependency checks are not a full integrity audit.

`ask`, `doctor` and `weave` retain the existing runtime API transport and require
appropriate server configuration and authorization. `ask` may incur provider
charges. `doctor --help` only displays help; `doctor` makes a health request.
`weave` compiles a proposal and does not execute the resulting plan. No live
provider or automatic terminal-startup evidence is established by this launcher.

See [Atelier](../../docs/A11OY_ATELIER.md) and
[Proofweave](../../docs/A11OY_ATELIER_PROOFWEAVE.md) for the capability boundaries.

## Validation

```powershell
pnpm --dir packages/a11oy-cli test
pnpm --dir packages/a11oy-cli test:launcher
pnpm --dir packages/a11oy-cli typecheck
```

The launcher cases are included in the package test command. They run on Windows
with PowerShell 7 installed; only these new cases are explicitly skipped on other
operating systems. A missing PowerShell runtime on Windows is a test failure.
The suite uses credential-free child environments and help/invalid-input paths,
with a 15-second limit per process. It checks argument preservation, missing Node,
exit codes, directory/preference restoration and dot-source refusal. It does not
establish backend or model availability.
