/**
 * UI tests for ConstellationGraph's "Expand neighbors" action  (task #1102).
 *
 * Mocks the network via global.fetch and renders the graph with a pre-built
 * `data` payload that contains a single internal node and a single
 * cross-domain edge to a placeholder node. Clicking that placeholder ("Cross-
 * domain entity") and then "+ Expand neighbors" must fire a request to
 * /api/graph/entities/:id/neighbors and inline-replace the placeholder with
 * the real entity returned by the API.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import {
  ConstellationGraph,
  type ConstellationGraphResponse,
} from "../../lib/shared-ui/src/constellation-graph";

const HUB_ID = "11111111-1111-1111-1111-111111111111";
const PLACEHOLDER_ID = "22222222-2222-2222-2222-222222222222";
const NEW_NEIGHBOR_ID = "33333333-3333-3333-3333-333333333333";

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
  ],
  edges: [
    {
      id: "edge-hub-to-placeholder",
      fromNodeId: HUB_ID,
      toNodeId: PLACEHOLDER_ID,
      relationshipType: "owns",
      active: true,
    },
  ],
  stats: {
    nodeCount: 1,
    edgeCount: 1,
    crossDomainEdgeCount: 1,
    internalEdgeCount: 0,
  },
};

interface FetchCall {
  url: string;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("ConstellationGraph — Expand neighbors action", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  const calls: FetchCall[] = [];

  beforeEach(() => {
    calls.length = 0;

    // Throttle requestAnimationFrame so the graph's physics loop doesn't
    // monopolise the happy-dom event loop and starve waitFor / fetch promises.
    // We let ~30 frames fire (enough for layout & a few re-renders) then stop.
    let frameCount = 0;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      if (frameCount++ > 30) return 0;
      return setTimeout(() => cb(performance.now()), 16) as unknown as number;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));

    fetchSpy = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push({ url });

      // The component eagerly enriches placeholder nodes via /graph/entities/:id
      if (url.includes(`/graph/entities/${PLACEHOLDER_ID}`) && !url.includes("/neighbors")) {
        return jsonResponse({
          data: {
            node: {
              id: PLACEHOLDER_ID,
              entityType: "vessel",
              name: "Enriched Vessel",
              domain: "vessels",
            },
          },
        });
      }

      // Operator-driven expansion: HUB -> [PLACEHOLDER, NEW_NEIGHBOR]
      if (url.includes(`/graph/entities/${HUB_ID}/neighbors`)) {
        return jsonResponse({
          data: {
            node: baseData.nodes[0],
            neighbors: [
              {
                id: PLACEHOLDER_ID,
                entityType: "vessel",
                name: "Enriched Vessel",
                domain: "vessels",
              },
              {
                id: NEW_NEIGHBOR_ID,
                entityType: "organization",
                name: "Discovered Org",
                domain: "aegis",
              },
            ],
            edges: [
              {
                id: "edge-hub-to-placeholder",
                fromNodeId: HUB_ID,
                toNodeId: PLACEHOLDER_ID,
                relationshipType: "owns",
                active: true,
              },
              {
                id: "edge-hub-to-new",
                fromNodeId: HUB_ID,
                toNodeId: NEW_NEIGHBOR_ID,
                relationshipType: "monitored_by",
                active: true,
              },
            ],
          },
        });
      }

      // Operator-driven expansion: PLACEHOLDER -> [HUB, NEW_NEIGHBOR]
      // The placeholder click test expands the cross-domain entity itself,
      // and that expansion must turn it into the real "Enriched Vessel" entity.
      if (url.includes(`/graph/entities/${PLACEHOLDER_ID}/neighbors`)) {
        return jsonResponse({
          data: {
            node: {
              id: PLACEHOLDER_ID,
              entityType: "vessel",
              name: "Enriched Vessel",
              domain: "vessels",
            },
            neighbors: [
              baseData.nodes[0],
              {
                id: NEW_NEIGHBOR_ID,
                entityType: "organization",
                name: "Discovered Org",
                domain: "aegis",
              },
            ],
            edges: [
              {
                id: "edge-hub-to-placeholder",
                fromNodeId: HUB_ID,
                toNodeId: PLACEHOLDER_ID,
                relationshipType: "owns",
                active: true,
              },
              {
                id: "edge-placeholder-to-new",
                fromNodeId: PLACEHOLDER_ID,
                toNodeId: NEW_NEIGHBOR_ID,
                relationshipType: "linked_to",
                active: true,
              },
            ],
          },
        });
      }

      return new Response("not-mocked", { status: 500 });
    });

    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the placeholder cross-domain entity from the inbound edge", async () => {
    render(<ConstellationGraph data={baseData} height={300} />);

    // The placeholder node must exist in the DOM (rendered by id).
    await waitFor(() => {
      expect(document.querySelector(`[data-testid="constellation-node-${PLACEHOLDER_ID}"]`))
        .toBeTruthy();
    });
  });

  it("expanding the placeholder calls /graph/entities/:id/neighbors and replaces it inline with the real entity", async () => {
    render(<ConstellationGraph data={baseData} height={300} />);

    // Select the placeholder so the details panel + Expand button appear.
    const placeholder = await waitFor(() => {
      const el = document.querySelector(`[data-testid="constellation-node-${PLACEHOLDER_ID}"]`);
      expect(el).toBeTruthy();
      return el as Element;
    });

    await act(async () => { fireEvent.click(placeholder); });

    // Wait for the details panel to render with the expand button.
    const expandBtn = await waitFor(() => {
      const btn = screen.getByTestId("constellation-expand-neighbors");
      expect(btn).toBeTruthy();
      return btn;
    });

    await act(async () => { fireEvent.click(expandBtn); });

    // The neighbors call must have been fired against the placeholder id.
    await waitFor(() => {
      const hit = calls.find((c) => c.url.includes(`/graph/entities/${PLACEHOLDER_ID}/neighbors`));
      expect(hit).toBeTruthy();
    });

    // After the API resolves, the placeholder is replaced by the enriched
    // entity: the details panel now shows the real name and the owning domain.
    await waitFor(() => {
      const detailsPanel = screen.getByTestId("constellation-details");
      expect(detailsPanel.textContent).toContain("Enriched Vessel");
      expect(detailsPanel.textContent).toContain("vessel");
    });

    // The button label should switch to the "re-expand" variant once the
    // node has been expanded at least once.
    await waitFor(() => {
      const btn = screen.getByTestId("constellation-expand-neighbors");
      expect(btn.textContent).toMatch(/Re-expand/i);
    });

    // The newly-discovered neighbor (HUB -> NEW_NEIGHBOR) must now exist as a
    // real node in the SVG, replacing/augmenting the placeholder graph.
    await waitFor(() => {
      const newNode = document.querySelector(`[data-testid="constellation-node-${NEW_NEIGHBOR_ID}"]`);
      expect(newNode).toBeTruthy();
    });
  });

  it("shows a retry banner when expansion fails, then recovers on retry", async () => {
    // First neighbors call fails (500), second succeeds.
    let hubNeighborCalls = 0;
    fetchSpy.mockImplementation(async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push({ url });

      if (url.includes(`/graph/entities/${PLACEHOLDER_ID}`) && !url.includes("/neighbors")) {
        return jsonResponse({
          data: {
            node: {
              id: PLACEHOLDER_ID,
              entityType: "vessel",
              name: "Enriched Vessel",
              domain: "vessels",
            },
          },
        });
      }

      if (url.includes(`/graph/entities/${HUB_ID}/neighbors`)) {
        hubNeighborCalls += 1;
        if (hubNeighborCalls === 1) {
          return new Response(
            JSON.stringify({ error: "upstream timeout" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
        return jsonResponse({
          data: {
            node: baseData.nodes[0],
            neighbors: [
              {
                id: NEW_NEIGHBOR_ID,
                entityType: "organization",
                name: "Discovered Org",
                domain: "aegis",
              },
            ],
            edges: [
              {
                id: "edge-hub-to-new",
                fromNodeId: HUB_ID,
                toNodeId: NEW_NEIGHBOR_ID,
                relationshipType: "monitored_by",
                active: true,
              },
            ],
          },
        });
      }

      return new Response("not-mocked", { status: 500 });
    });

    render(<ConstellationGraph data={baseData} height={300} />);

    const hub = await waitFor(() => {
      const el = document.querySelector(`[data-testid="constellation-node-${HUB_ID}"]`);
      expect(el).toBeTruthy();
      return el as Element;
    });
    await act(async () => { fireEvent.click(hub); });

    const expandBtn = await waitFor(() => screen.getByTestId("constellation-expand-neighbors"));
    await act(async () => { fireEvent.click(expandBtn); });

    // The error banner appears with a retry button
    const banner = await waitFor(() => {
      const el = screen.getByTestId("constellation-expand-error");
      expect(el).toBeTruthy();
      return el;
    });
    expect(banner.getAttribute("role")).toBe("alert");
    expect(banner.textContent).toMatch(/Couldn’t expand neighbors|Couldn't expand neighbors/);

    const retryBtn = screen.getByTestId("constellation-expand-retry");
    expect(retryBtn.textContent).toMatch(/Retry expansion/i);

    // Click retry — second call succeeds
    await act(async () => { fireEvent.click(retryBtn); });

    // Banner disappears once retry succeeds
    await waitFor(() => {
      expect(screen.queryByTestId("constellation-expand-error")).toBeNull();
    });

    // The new neighbor must now be in the SVG
    await waitFor(() => {
      expect(
        document.querySelector(`[data-testid="constellation-node-${NEW_NEIGHBOR_ID}"]`),
      ).toBeTruthy();
    });

    // Confirm we issued exactly two neighbor requests (initial + retry)
    expect(hubNeighborCalls).toBe(2);
  });

  it("debounces search-query URL writes: keystrokes share one history entry, chip clicks push their own", async () => {
    // The filter panel (and search input) only render when the graph drives
    // its own fetch — i.e. `domain` is provided instead of `data`. Mock that
    // fetch with the same payload other tests use.
    fetchSpy.mockImplementation(async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push({ url });
      if (url.includes("/domains/terra/graph")) {
        return jsonResponse({ data: baseData });
      }
      return new Response("not-mocked", { status: 500 });
    });

    // Reset URL so the initial sync doesn't see leftover query params from
    // earlier tests (jsdom shares window.location across tests in the file).
    window.history.replaceState(null, "", "/");

    // Spy on the history methods so we can assert push vs. replace usage.
    const pushSpy = vi.spyOn(window.history, "pushState");
    const replaceSpy = vi.spyOn(window.history, "replaceState");

    render(<ConstellationGraph domain="terra" height={300} />);

    // Wait for the search input to appear.
    const searchInput = await waitFor(() =>
      screen.getByTestId("constellation-search") as HTMLInputElement,
    );

    // Reset spies so we only count post-mount activity (initial mount may
    // replaceState once to normalise the URL).
    pushSpy.mockClear();
    replaceSpy.mockClear();

    // Type "tank" one character at a time. The first keystroke should push
    // exactly one new history entry; the rest should only replace it in place.
    for (const ch of ["t", "ta", "tan", "tank"]) {
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: ch } });
      });
    }

    expect(pushSpy).toHaveBeenCalledTimes(1);
    // 3 mid-session replaces for the 2nd/3rd/4th keystrokes.
    expect(replaceSpy).toHaveBeenCalledTimes(3);
    // The URL reflects the latest typed value, not a stale mid-word state.
    expect(window.location.search).toContain("q=tank");

    // Wait past the 300ms debounce so the typing session closes.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 350));
    });

    // A discrete chip click after the session closes must push its own entry.
    pushSpy.mockClear();
    replaceSpy.mockClear();
    const activeChip = screen.getByTestId("constellation-active-chip");
    await act(async () => {
      fireEvent.click(activeChip);
    });
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).not.toHaveBeenCalled();

    pushSpy.mockRestore();
    replaceSpy.mockRestore();
  });

  it("hub neighbors call is sent with limit=25 by default", async () => {
    render(<ConstellationGraph data={baseData} height={300} />);

    const hub = await waitFor(() => {
      const el = document.querySelector(`[data-testid="constellation-node-${HUB_ID}"]`);
      expect(el).toBeTruthy();
      return el as Element;
    });
    await act(async () => { fireEvent.click(hub); });

    const expandBtn = await waitFor(() => screen.getByTestId("constellation-expand-neighbors"));
    await act(async () => { fireEvent.click(expandBtn); });

    await waitFor(() => {
      const neighborCall = calls.find((c) =>
        c.url.includes(`/graph/entities/${HUB_ID}/neighbors`),
      );
      expect(neighborCall).toBeTruthy();
      expect(neighborCall!.url).toContain("limit=25");
    });
  });
});
