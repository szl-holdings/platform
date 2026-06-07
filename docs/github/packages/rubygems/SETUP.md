# RubyGems / GitHub Packages Setup Guide

> Status: **Template ready — no Ruby gems exist yet.**
> Activate this when the first Ruby gem enters the ecosystem.

---

## Prerequisites

- Ruby 3.2+
- Bundler 2.4+
- GitHub account with access to `szl-holdings` org
- GitHub PAT with `read:packages` and `write:packages` scopes

---

## Quick-Start (new Ruby gem)

### 1. Create gem structure

```bash
bundle gem szl-holdings-your-gem
cd szl-holdings-your-gem
```

### 2. Copy the gemspec template

```bash
cp docs/github/packages/rubygems/szl-holdings-template.gemspec \
   szl-holdings-your-gem.gemspec
```

Update:
- `spec.name` — use kebab-case: `szl-holdings-your-gem`
- `spec.summary` and `spec.description`
- `spec.version` — start at `0.1.0`

### 3. Configure GitHub Packages credentials

Create/update `~/.gem/credentials`:
```yaml
---
:github: Bearer ghp_YOUR_PAT_WITH_write_packages_SCOPE
```

Set permissions:
```bash
chmod 0600 ~/.gem/credentials
```

Or set as environment variable (preferred for CI):
```bash
export GEM_HOST_API_KEY="Bearer $GITHUB_TOKEN"
```

### 4. Build the gem

```bash
gem build szl-holdings-your-gem.gemspec
```

### 5. Push to GitHub Packages

```bash
gem push --key github \
  --host https://rubygems.pkg.github.com/szl-holdings \
  szl-holdings-your-gem-0.1.0.gem
```

### 6. Verify

```
https://github.com/orgs/szl-holdings/packages?repo_name=szl-holdings-platform
```

---

## Consuming a SZL Holdings gem

In `Gemfile`:
```ruby
source "https://rubygems.pkg.github.com/szl-holdings" do
  gem "szl-holdings-your-gem", "~> 0.1"
end
```

Set credentials in your environment:
```bash
export BUNDLE_RUBYGEMS__PKG__GITHUB__COM=your_github_token
```

Or in `~/.bundle/config`:
```
BUNDLE_RUBYGEMS__PKG__GITHUB__COM: "your_github_token"
```

---

## Gem Naming Convention

| Format | Example |
|--------|---------|
| `szl-holdings-<name>` | `szl-holdings-lyte` |
| `szl-holdings-<product>-<module>` | `szl-holdings-aegis-client` |

---

## Version Strategy

Follow semver: MAJOR.MINOR.PATCH
- `0.x.y` — Pre-stable (breaking changes allowed)
- `1.0.0+` — Stable public API

---

## GitHub Actions CI

See `.github/workflows/rubygems-publish.yml` for the automated publish workflow.

---

## Free Tier Limits

GitHub Packages free tier:
- **Storage:** 500 MB
- **Data transfer:** 1 GB/month
