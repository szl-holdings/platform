# Event Naming Conventions

## Format
```
{domain}.{object}.{action}
```

## Rules
1. All lowercase with dots as separators
2. Domain is the product area (auth, nav, lyte, terra, vessels, aegis, content, support, export, error)
3. Object is the entity being acted upon (session, page, property, vessel, workflow)
4. Action is past tense (viewed, created, approved, failed)
5. No abbreviations
6. No PII in event names or properties

## Properties
Every event includes:
- `timestamp` — ISO 8601
- `session_id` — Anonymous session identifier
- `user_role` — Role of the user (admin, operator, viewer, public)
- `product` — Which product (lyte, terra, vessels, aegis, carlota, szl)
- `path` — Current route path

Domain-specific properties are added per event (e.g., `property_id` for terra events).

## Anti-Patterns
- ❌ `click` — Too vague, what was clicked?
- ❌ `user_did_thing` — Not structured
- ❌ `ButtonClicked` — Wrong case, wrong format
- ❌ Events with user email in the name
- ❌ Events fired on every keystroke
