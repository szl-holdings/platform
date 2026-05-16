## Add canonical contact email to CITATION.cff

**Repo:** `szl-holdings/carlota-jo`
**Branch:** `chore/citation-email-carlota-jo`

### What changed

Added `email: stephen@szlholdings.com` to the canonical author block (and `preferred-citation` author block where present) in `CITATION.cff`, per the SZL Holdings author metadata standard.

The `email:` field was present in the CFF 1.2.0 schema definition for author objects but had been omitted from the initial commit of this file. No other fields were altered — `family-names`, `given-names`, `name-particle`, `affiliation`, and `orcid` are unchanged.

### Author block after this PR

```yaml
- family-names: Lutar
  given-names: Stephen
  name-particle: P.
  email: stephen@szlholdings.com
  affiliation: SZL Holdings
  orcid: "https://orcid.org/0009-0001-0110-4173"
```

### Validation

YAML validated clean with:
```
python3 -c "import yaml; yaml.safe_load(open('CITATION.cff'))"
```

### References

- [CFF 1.2.0 Schema — Person object](https://github.com/citation-file-format/citation-file-format/blob/main/schema-guide.md)
- Author ORCID: `https://orcid.org/0009-0001-0110-4173`
- SZL Holdings author metadata standard: `email: stephen@szlholdings.com`
