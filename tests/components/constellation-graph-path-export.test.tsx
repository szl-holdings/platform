/**
 * UI tests for the "Export path" action in the Constellation graph path summary
 * banner (task #1139). Covers the pure helpers that build the JSON + Markdown
 * artifact, plus a render test that verifies clicking the button triggers the
 * downloads with sensible filenames.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import {
  ConstellationGraph,
  buildPathExportPayload,
  buildPathExportMarkdown,
  type ConstellationGraphResponse,
  type ConstellationGraphNode,
  type ConstellationGraphEdge,
} from "../../lib/shared-ui/src/constellation-graph";

const HUB_ID = "11111111-1111-1111-1111-111111111111";
const TARGET_ID = "22222222-2222-2222-2222-222222222222";

const baseData: ConstellationGraphResponse = {
  domain: "terra",
  nodes: [
    {
      id: HUB_ID,
      entityType: "property",
      name: "Hub Property",
      domain: "terra",
      confidence: 0.9,
    },
    {
      id: TARGET_ID,
      entityType: "vessel",
      name: "Target Vessel",
      domain: "vessels",
      confidence: 0.7,
    },
  ],
  edges: [
    {
      id: "edge-hub-to-target",
      fromNodeId: HUB_ID,
      toNodeId: TARGET_ID,
      relationshipType: "owns",
      active: true,
    },
  ],
  stats: {
    nodeCount: 2,
    edgeCount: 1,
    crossDomainEdgeCount: 1,
    internalEdgeCount: 0,
  },
};

const sampleNodes: ConstellationGraphNode[] = [
  { id: HUB_ID, entityType: "property", name: "Hub Property", domain: "terra" },
  { id: TARGET_ID, entityType: "vessel", name: "Target Vessel", domain: "vessels" },
];

const sampleEdges: ConstellationGraphEdge[] = [
  {
    id: "edge-hub-to-target",
    fromNodeId: HUB_ID,
    toNodeId: TARGET_ID,
    relationshipType: "owns",
    active: true,
  },
];

describe("buildPathExportPayload", () => {
  it("captures origin, target, ordered hops, relationship types, and cross-domain steps", () => {
    const payload = buildPathExportPayload(
      {
        from: { id: HUB_ID, name: "Hub Property" },
        to: { id: TARGET_ID, name: "Target Vessel" },
        found: true,
        depth: 1,
        nodes: sampleNodes,
        edges: sampleEdges,
        crossDomainSteps: [0],
        maxDepth: 4,
      },
      "terra",
    );

    expect(payload.schemaVersion).toBe(1);
    expect(payload.found).toBe(true);
    expect(payload.depth).toBe(1);
    expect(payload.hopCount).toBe(1);
    expect(payload.crossDomainStepCount).toBe(1);
    expect(payload.hostDomain).toBe("terra");
    expect(payload.origin).toMatchObject({ id: HUB_ID, name: "Hub Property", domain: "terra" });
    expect(payload.target).toMatchObject({ id: TARGET_ID, name: "Target Vessel", domain: "vessels" });
    expect(payload.hops).toHaveLength(1);
    expect(payload.hops[0]).toMatchObject({
      index: 0,
      isCrossDomain: true,
      relationshipType: "owns",
      edgeId: "edge-hub-to-target",
    });
    expect(payload.hops[0].from.id).toBe(HUB_ID);
    expect(payload.hops[0].to.id).toBe(TARGET_ID);
    expect(payload.nodes.map((n) => n.id)).toEqual([HUB_ID, TARGET_ID]);
    expect(payload.edges.map((e) => e.id)).toEqual(["edge-hub-to-target"]);
    expect(typeof payload.exportedAt).toBe("string");
  });

  it("handles same-domain multi-hop paths with no cross-domain markers", () => {
    const midId = "33333333-3333-3333-3333-333333333333";
    const nodes: ConstellationGraphNode[] = [
      { id: HUB_ID, entityType: "property", name: "A", domain: "terra" },
      { id: midId, entityType: "property", name: "B", domain: "terra" },
      { id: TARGET_ID, entityType: "property", name: "C", domain: "terra" },
    ];
    const edges: ConstellationGraphEdge[] = [
      { id: "e1", fromNodeId: HUB_ID, toNodeId: midId, relationshipType: "near" },
      { id: "e2", fromNodeId: midId, toNodeId: TARGET_ID, relationshipType: "near" },
    ];
    const payload = buildPathExportPayload(
      {
        from: { id: HUB_ID, name: "A" },
        to: { id: TARGET_ID, name: "C" },
        found: true,
        depth: 2,
        nodes,
        edges,
        crossDomainSteps: [],
        maxDepth: 4,
      },
      "terra",
    );
    expect(payload.crossDomainStepCount).toBe(0);
    expect(payload.hops.every((h) => h.isCrossDomain === false)).toBe(true);
    expect(payload.hops.map((h) => h.relationshipType)).toEqual(["near", "near"]);
  });
});

describe("buildPathExportMarkdown", () => {
  it("produces a readable summary with origin, target, and ordered cross-domain steps", () => {
    const payload = buildPathExportPayload(
      {
        from: { id: HUB_ID, name: "Hub Property" },
        to: { id: TARGET_ID, name: "Target Vessel" },
        found: true,
        depth: 1,
        nodes: sampleNodes,
        edges: sampleEdges,
        crossDomainSteps: [0],
        maxDepth: 4,
      },
      "terra",
    );
    const md = buildPathExportMarkdown(payload);
    expect(md).toContain("# Constellation Path — Hub Property → Target Vessel");
    expect(md).toContain("Hops: 1");
    expect(md).toContain("Cross-domain steps: 1");
    expect(md).toContain("**Origin:** Hub Property");
    expect(md).toContain("**Target:** Target Vessel");
    expect(md).toMatch(/1\. Hub Property.*—\[owns\]→.*Target Vessel.*cross-domain/);
  });
});

describe("ConstellationGraph — Export path button", () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  const downloads: { name: string; type: string; size: number }[] = [];

  beforeEach(() => {
    downloads.length = 0;

    let frameCount = 0;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      if (frameCount++ > 30) return 0;
      return setTimeout(() => cb(performance.now()), 16) as unknown as number;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
        const url = typeof input === "string" ? input : input.toString();
        // The graph eagerly enriches placeholder/cross-domain nodes — return
        // the canonical node so the SVG renders cleanly.
        if (url.includes(`/graph/entities/${TARGET_ID}`) && !url.includes("/path/")) {
          return new Response(
            JSON.stringify({ data: { node: baseData.nodes[1] } }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        // The shortest-path lookup the test triggers via the "Find path"
        // affordance. Returns a single-hop cross-domain chain.
        if (
          url.includes(`/graph/entities/${HUB_ID}/path/${TARGET_ID}`)
        ) {
          return new Response(
            JSON.stringify({
              data: {
                from: { id: HUB_ID, name: "Hub Property", domain: "terra" },
                to: { id: TARGET_ID, name: "Target Vessel", domain: "vessels" },
                found: true,
                depth: 1,
                maxDepth: 4,
                path: {
                  nodes: sampleNodes,
                  edges: sampleEdges,
                  crossDomainSteps: [0],
                },
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response("not-mocked", { status: 500 });
      }),
    );

    // Capture the blobs that the export action streams through createObjectURL
    // so we can assert on filenames + content types without poking the DOM.
    createObjectURLSpy = vi.fn((blob: Blob) => {
      downloads.push({
        name: "",
        type: blob.type,
        size: blob.size,
      });
      return `blob:mock-${downloads.length}`;
    });
    revokeObjectURLSpy = vi.fn();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    });

    // Patch HTMLAnchorElement.click so the test environment doesn't try to
    // actually navigate. Track the download filename for each anchor.
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      const idx = downloads.length - 1;
      if (idx >= 0) downloads[idx].name = (this as HTMLAnchorElement).download;
      // Don't call origClick — happy-dom would try to follow blob: URLs.
      return undefined as unknown as void;
    };
    // Restore on teardown via stub registry.
    (globalThis as unknown as { __origAnchorClick?: typeof origClick }).__origAnchorClick = origClick;
  });

  afterEach(() => {
    const orig = (globalThis as unknown as { __origAnchorClick?: () => void }).__origAnchorClick;
    if (orig) HTMLAnchorElement.prototype.click = orig as typeof HTMLAnchorElement.prototype.click;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("appears in the path summary banner and downloads JSON + Markdown when clicked", async () => {
    render(<ConstellationGraph data={baseData} height={300} />);

    // Select the hub.
    const hub = await waitFor(() => {
      const el = document.querySelector(`[data-testid="constellation-node-${HUB_ID}"]`);
      expect(el).toBeTruthy();
      return el as Element;
    });
    await act(async () => { fireEvent.click(hub); });

    // Arm "Find path to…" and then click the target to trigger the lookup.
    const findPathBtn = await waitFor(() => screen.getByTestId("constellation-find-path"));
    await act(async () => { fireEvent.click(findPathBtn); });
    const target = document.querySelector(`[data-testid="constellation-node-${TARGET_ID}"]`)!;
    await act(async () => { fireEvent.click(target); });

    // Wait for the path summary banner with the export button to appear.
    const exportBtn = await waitFor(() => screen.getByTestId("constellation-path-export"));
    expect(exportBtn).toBeTruthy();

    await act(async () => { fireEvent.click(exportBtn); });

    // The JSON + Markdown downloads should fire synchronously from the click;
    // the PNG step is best-effort and may error in happy-dom (no real Image
    // decoder) — that's fine, the JSON/Markdown are what counts.
    await waitFor(() => {
      expect(downloads.length).toBeGreaterThanOrEqual(2);
    });

    const jsonDl = downloads.find((d) => d.type.startsWith("application/json"));
    const mdDl = downloads.find((d) => d.type.startsWith("text/markdown"));
    expect(jsonDl).toBeTruthy();
    expect(mdDl).toBeTruthy();
    expect(jsonDl!.name).toMatch(/^constellation-path-hub-property-to-target-vessel-.*\.json$/);
    expect(mdDl!.name).toMatch(/^constellation-path-hub-property-to-target-vessel-.*\.md$/);
    expect(jsonDl!.size).toBeGreaterThan(0);
    expect(mdDl!.size).toBeGreaterThan(0);
  });
});
