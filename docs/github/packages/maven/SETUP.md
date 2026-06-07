# Maven / GitHub Packages Setup Guide

> Status: **Template ready — no Java/Kotlin packages exist yet.**
> Activate this when the first Java or Kotlin package enters the ecosystem.

---

## Prerequisites

- Java 21+
- Maven 3.9+
- GitHub account with access to `szl-holdings` org
- GitHub PAT with `read:packages` and `write:packages` scopes

---

## Quick-Start (new Java package)

### 1. Copy the template

```bash
cp docs/github/packages/maven/pom.xml <your-java-package>/pom.xml
cp docs/github/packages/maven/settings.xml ~/.m2/settings.xml
```

### 2. Update pom.xml

Edit the following fields in your `pom.xml`:
- `artifactId` — use kebab-case: `szl-your-package-name`
- `name` — human-readable name
- `description`
- `version` — start at `0.1.0` for new packages

Keep `groupId` as `com.szlholdings`.

### 3. Configure local credentials

```bash
export GITHUB_ACTOR=your-github-username
export GITHUB_TOKEN=ghp_your_pat_here
```

Or add to your shell profile:
```bash
echo 'export GITHUB_TOKEN=ghp_your_pat_here' >> ~/.zshrc
```

### 4. Build and publish

```bash
# Build
mvn clean package -s ~/.m2/settings.xml

# Publish to GitHub Packages
mvn deploy -s ~/.m2/settings.xml
```

### 5. Verify

```bash
# Check package appeared at:
# https://github.com/orgs/szl-holdings/packages?repo_name=szl-holdings-platform
```

---

## Consuming a SZL Holdings Maven package

In consumer `pom.xml`:
```xml
<dependencies>
  <dependency>
    <groupId>com.szlholdings</groupId>
    <artifactId>szl-your-package</artifactId>
    <version>0.1.0</version>
  </dependency>
</dependencies>
```

In consumer `settings.xml` (or `~/.m2/settings.xml`):
```xml
<server>
  <id>github</id>
  <username>GITHUB_ACTOR</username>
  <password>GITHUB_TOKEN</password>
</server>
```

---

## Version Strategy

| Pattern | Use Case |
|---------|----------|
| `0.x.y` | Pre-stable (no breaking-change guarantee) |
| `1.0.0+` | Stable public API |
| `x.y.z-SNAPSHOT` | Development builds (CI only, not for production) |

Follow semver: MAJOR.MINOR.PATCH

---

## GitHub Actions CI

See `.github/workflows/maven-publish.yml` for the manual publish workflow.
It is triggered manually via `workflow_dispatch` (Actions → Run workflow) and requires
`package_path` and `version` as inputs. It uses `secrets.GITHUB_TOKEN` automatically.

---

## Free Tier Limits

GitHub Packages free tier (as of 2024):
- **Storage:** 500 MB
- **Data transfer:** 1 GB/month

For larger packages, see the [GitHub Packages billing docs](https://docs.github.com/en/billing/managing-billing-for-github-packages/about-billing-for-github-packages).
