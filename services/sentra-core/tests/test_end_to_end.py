"""End-to-end: threat_model -> incident_response -> evidence_pack -> receipt."""

import time

from sentra_core.evidence_pack import EvidenceItem, HMACSigner, build_pack
from sentra_core.incident_response import (
    Incident,
    InMemoryEventSink,
    RunbookContext,
    execute,
    runbook_for,
)
from sentra_core.threat_model import Asset, ThreatSource, build_threat_graph


def test_threat_to_incident_to_evidence_receipt():
    # 1. Build threat graph
    assets = [
        Asset(id="srv1", name="prod-api", kind="server", exposure="critical"),
        Asset(id="id1", name="okta", kind="identity", exposure="high"),
    ]
    sources = [ThreatSource(id="apt", name="APT-X", techniques=("T1486", "T1003"))]
    graph = build_threat_graph(assets, sources)
    assert graph.top_risks, "threat model produced no risks"
    top = graph.top_risks[0]

    # 2. Materialize an incident from the top risk + execute the runbook
    incident = Incident(
        id="inc-e2e",
        title=f"Detected {top.technique_id} against {top.asset_id}",
        severity="critical",
        mitre_techniques=tuple({e.technique_id for e in graph.top_risks}),
        affected_assets=tuple({e.asset_id for e in graph.top_risks}),
    )
    rb = runbook_for("ransomware")
    ctx = RunbookContext(incident, approvals={"operator_confirm_eradication": True})
    sink = InMemoryEventSink()
    result = execute(rb, ctx, sink)
    assert result.status == "completed"
    assert len(sink.events) >= 4

    # 3. Build a signed, hash-chained evidence pack containing the run trace
    signer = HMACSigner(secret=b"e2e-secret")
    items = [
        EvidenceItem(
            id="threat-graph",
            kind="report",
            description="threat graph snapshot",
            payload=str(graph.to_dict()).encode(),
            collected_at=time.time(),
        ),
        EvidenceItem(
            id="run-trace",
            kind="report",
            description="incident response run trace",
            payload=str(result.to_dict()).encode(),
            collected_at=time.time(),
        ),
    ]

    published = []

    class CapturePublisher:
        def publish(self, topic, payload):
            published.append((topic, payload))

    pack = build_pack(
        incident.id, items, signer, publisher=CapturePublisher()
    )

    # 4. Receipt: pack is verifiable + hash published to yawar topic
    assert pack.verify(signer)
    assert published, "evidence pack hash was not published to yawar"
    topic, receipt = published[0]
    assert topic == "sentra.evidence"
    assert receipt["pack_hash"] == pack.pack_hash
    assert receipt["incident_id"] == incident.id
