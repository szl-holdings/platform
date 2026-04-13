import {
  LanguageTabs, SectionHeader, SubSectionHeader,
} from "./shared";

export function CodeSamplesSection() {
  return (
    <section>
      <SectionHeader
        id="code-samples"
        title="Code Samples"
        subtitle="Common operations in JavaScript (Node.js), Python, and cURL."
      />

      <SubSectionHeader id="samples-auth" title="Authentication" />
      <LanguageTabs
        tabs={[
          {
            label: "JavaScript",
            language: "javascript",
            filename: "auth.js",
            code: `import { createReplitAuth } from '@replit/auth-client';

// Initialize with your Replit identity token
async function authenticate() {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: replitIdentityToken }),
  });

  if (!response.ok) {
    throw new Error(\`Auth failed: \${response.status}\`);
  }

  const { token, user } = await response.json();
  return { token, user };
}

// Reusable authenticated client
function createApiClient(token) {
  return {
    async get(path) {
      const res = await fetch(\`/api\${path}\`, {
        headers: { Authorization: \`Bearer \${token}\` },
      });
      if (!res.ok) throw new Error(\`API error: \${res.status}\`);
      return res.json();
    },
    async post(path, data) {
      const res = await fetch(\`/api\${path}\`, {
        method: 'POST',
        headers: {
          Authorization: \`Bearer \${token}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(\`API error: \${res.status}\`);
      return res.json();
    },
  };
}`,
          },
          {
            label: "Python",
            language: "python",
            filename: "auth.py",
            code: `import requests

class SZLClient:
    """Authenticated SZL Holdings API client."""

    BASE_URL = "https://[host]/api"

    def __init__(self, token: str):
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        })

    @classmethod
    def from_credential(cls, credential: str) -> "SZLClient":
        """Authenticate and return a ready client."""
        res = requests.post(
            f"{cls.BASE_URL}/auth/login",
            json={"credential": credential},
        )
        res.raise_for_status()
        return cls(res.json()["token"])

    def get(self, path: str) -> dict:
        res = self.session.get(f"{self.BASE_URL}{path}")
        res.raise_for_status()
        return res.json()

    def post(self, path: str, data: dict) -> dict:
        res = self.session.post(f"{self.BASE_URL}{path}", json=data)
        res.raise_for_status()
        return res.json()`,
          },
          {
            label: "cURL",
            language: "bash",
            filename: "auth.sh",
            code: `# Authenticate and extract token
TOKEN=$(curl -s -X POST https://[host]/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"credential": "$REPLIT_IDENTITY_TOKEN"}' \\
  | jq -r '.token')

# Export for reuse in subsequent calls
export SZL_TOKEN="$TOKEN"

# Verify by fetching current user
curl https://[host]/api/auth/me \\
  -H "Authorization: Bearer $SZL_TOKEN"`,
          },
        ]}
      />

      <SubSectionHeader id="samples-projects" title="Projects" />
      <LanguageTabs
        tabs={[
          {
            label: "JavaScript",
            language: "javascript",
            filename: "projects.js",
            code: `const client = createApiClient(token);

// List all projects
const projects = await client.get('/projects');
console.log(\`Found \${projects.length} projects\`);

// Create a project
const newProject = await client.post('/projects', {
  name: 'Maritime Risk Assessment Q2',
  description: 'Quarterly route risk analysis',
  status: 'active',
});
console.log('Created:', newProject.id);

// Update a project
const updated = await client.patch(\`/projects/\${newProject.id}\`, {
  status: 'completed',
});`,
          },
          {
            label: "Python",
            language: "python",
            filename: "projects.py",
            code: `client = SZLClient.from_credential(credential)

# List all projects
projects = client.get("/projects")
print(f"Found {len(projects)} projects")

# Create a project
new_project = client.post("/projects", {
    "name": "Maritime Risk Assessment Q2",
    "description": "Quarterly route risk analysis",
    "status": "active",
})
print(f"Created project {new_project['id']}")`,
          },
          {
            label: "cURL",
            language: "bash",
            filename: "projects.sh",
            code: `# List all projects
curl https://[host]/api/projects \\
  -H "Authorization: Bearer $SZL_TOKEN"

# Create a project
curl -X POST https://[host]/api/projects \\
  -H "Authorization: Bearer $SZL_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Maritime Risk Assessment Q2",
    "description": "Quarterly route risk analysis",
    "status": "active"
  }'`,
          },
        ]}
      />

      <SubSectionHeader id="samples-vessels" title="Vessels" />
      <LanguageTabs
        tabs={[
          {
            label: "JavaScript",
            language: "javascript",
            filename: "vessels.js",
            code: `const client = createApiClient(token);

// List all vessels in the fleet
const fleet = await client.get('/vessels');

// Get a specific vessel with live position
const vessel = await client.get('/vessels/42');
console.log(\`\${vessel.name} at \${vessel.position.lat}, \${vessel.position.lon}\`);

// Get live chokepoint analysis
const intel = await client.get('/vessels/live/chokepoints');
console.log('Active chokepoints:', intel.chokepoints);

// Create a vessel alert
const alert = await client.post('/vessels/42/alerts', {
  type: 'route_deviation',
  severity: 'high',
  message: 'Vessel deviated 45nm from planned route',
});`,
          },
          {
            label: "Python",
            language: "python",
            filename: "vessels.py",
            code: `client = SZLClient.from_credential(credential)

# List fleet
fleet = client.get("/vessels")
print(f"Fleet size: {len(fleet)}")

# Live chokepoint intel
intel = client.get("/vessels/live/chokepoints")
for cp in intel.get("chokepoints", []):
    print(f"Chokepoint: {cp['name']} — Risk: {cp['riskLevel']}")

# Get vessel details
vessel = client.get("/vessels/42")
print(f"Vessel: {vessel['name']}, IMO: {vessel['imo']}")`,
          },
          {
            label: "cURL",
            language: "bash",
            filename: "vessels.sh",
            code: `# List fleet
curl https://[host]/api/vessels \\
  -H "Authorization: Bearer $SZL_TOKEN"

# Get live chokepoint intelligence
curl https://[host]/api/vessels/live/chokepoints \\
  -H "Authorization: Bearer $SZL_TOKEN"

# Get a specific vessel
curl https://[host]/api/vessels/42 \\
  -H "Authorization: Bearer $SZL_TOKEN"`,
          },
        ]}
      />

      <SubSectionHeader id="samples-alloy" title="Alloy Signal Ingestion" />
      <LanguageTabs
        tabs={[
          {
            label: "JavaScript",
            language: "javascript",
            filename: "alloy-signals.js",
            code: `const client = createApiClient(token);

// Ingest a signal to trigger an Alloy workflow
const result = await client.post('/alloy/ingest/signal', {
  domain: 'vessels',
  type: 'port_delay',
  severity: 'medium',
  entityId: 'vessel_ocean_pioneer_88',
  payload: {
    port: 'USGUL',
    delayHours: 18,
    reason: 'weather',
    affectedCargo: ['container', 'bulk'],
  },
  metadata: {
    source: 'ais_feed',
    confidence: 0.94,
  },
});

console.log('Signal ID:', result.signalId);
console.log('Workflows triggered:', result.workflowsTriggered);`,
          },
          {
            label: "Python",
            language: "python",
            filename: "alloy_signals.py",
            code: `client = SZLClient.from_credential(credential)

# Ingest a signal
result = client.post("/alloy/ingest/signal", {
    "domain": "vessels",
    "type": "port_delay",
    "severity": "medium",
    "entityId": "vessel_ocean_pioneer_88",
    "payload": {
        "port": "USGUL",
        "delayHours": 18,
        "reason": "weather",
    },
    "metadata": {
        "source": "ais_feed",
        "confidence": 0.94,
    },
})
print(f"Signal {result['signalId']} — {result['workflowsTriggered']} workflows triggered")`,
          },
          {
            label: "cURL",
            language: "bash",
            filename: "alloy-signals.sh",
            code: `curl -X POST https://[host]/api/alloy/ingest/signal \\
  -H "Authorization: Bearer $SZL_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "domain": "vessels",
    "type": "port_delay",
    "severity": "medium",
    "entityId": "vessel_ocean_pioneer_88",
    "payload": {
      "port": "USGUL",
      "delayHours": 18,
      "reason": "weather"
    }
  }'`,
          },
        ]}
      />
    </section>
  );
}
