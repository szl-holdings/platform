# Integration Documentation Template

## [Integration Name]

### Overview
- **Provider**: [Company name]
- **Category**: [Auth / Data / Storage / AI / Payments / Communication]
- **Status**: [✅ Live / 🔶 Beta / 🗓️ Planned / 🔒 Internal Only]
- **Owner**: [Team or person responsible]
- **Last verified**: [Date]

### What It Does
[1-2 sentence description of what this integration provides]

### Configuration
- **Credentials**: Stored in environment secrets
- **Key/Token name**: [ENV_VAR_NAME]
- **Scope/Permissions**: [What permissions are requested]

### How It's Used
- [Use case 1]
- [Use case 2]

### Endpoints/APIs Used
| API | Purpose | Rate Limit |
|-----|---------|-----------|
| [endpoint] | [purpose] | [limit] |

### Error Handling
- [How errors are surfaced]
- [Retry strategy]
- [Fallback behavior]

### Security Notes
- Credentials: [How stored]
- Data flow: [What data is sent/received]
- Privacy: [Any PII considerations]

### Dependencies
- [What breaks if this integration goes down]
- [Fallback plan]

### Links
- Provider docs: [URL]
- Internal docs: [path]
- Support contact: [email/channel]
