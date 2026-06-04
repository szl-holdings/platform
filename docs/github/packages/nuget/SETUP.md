# NuGet / GitHub Packages Setup Guide

> Status: **Template ready — no .NET packages exist yet.**
> Activate this when the first C#/F#/VB.NET package enters the ecosystem.

---

## Prerequisites

- .NET SDK 8.0+
- GitHub account with access to `szl-holdings` org
- GitHub PAT with `read:packages` and `write:packages` scopes

---

## Quick-Start (new .NET package)

### 1. Copy the template

```bash
cp docs/github/packages/nuget/template.csproj <your-dotnet-package>/<PackageId>.csproj
cp docs/github/packages/nuget/nuget.config ./nuget.config
```

### 2. Update the .csproj

Edit these fields:
- `PackageId` — use `SzlHoldings.YourPackageName` format
- `Description`
- `PackageTags`
- `Version` — start at `0.1.0`

### 3. Configure local credentials

```bash
dotnet nuget add source https://nuget.pkg.github.com/szl-holdings/index.json \
  --name "github" \
  --username YOUR_GITHUB_USERNAME \
  --password YOUR_GITHUB_TOKEN \
  --store-password-in-clear-text
```

Or set environment variables used by `nuget.config`:
```bash
export GITHUB_ACTOR=your-github-username
export GITHUB_TOKEN=ghp_your_pat_here
```

### 4. Build and pack

```bash
dotnet build --configuration Release
dotnet pack --configuration Release --output ./nupkg
```

### 5. Push to GitHub Packages

```bash
dotnet nuget push ./nupkg/*.nupkg \
  --source "github" \
  --api-key $GITHUB_TOKEN
```

### 6. Verify

```
https://github.com/orgs/szl-holdings/packages?repo_name=szl-holdings-platform
```

---

## Consuming a SZL Holdings NuGet package

In consumer project:
```bash
dotnet add package SzlHoldings.YourPackage --version 0.1.0
```

Ensure `nuget.config` includes the `github` source (copy from this template).

---

## Package Naming Convention

| Format | Example |
|--------|---------|
| `SzlHoldings.<ProductName>` | `SzlHoldings.Lyte` |
| `SzlHoldings.<Domain>.<Module>` | `SzlHoldings.Aegis.Telemetry` |

---

## Version Strategy

Follow semver: MAJOR.MINOR.PATCH
- `0.x.y` — Pre-stable
- `1.0.0+` — Stable public API

---

## GitHub Actions CI

See `.github/workflows/nuget-publish.yml` for the automated publish workflow.

---

## Free Tier Limits

GitHub Packages free tier:
- **Storage:** 500 MB
- **Data transfer:** 1 GB/month
